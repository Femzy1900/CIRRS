/**
 * CIRS Item Matching Engine
 *
 * Scoring (max meaningful score ~21):
 *   +3  same category (always true — pre-filtered)
 *   +3  date ≤ 3 days apart | +2 ≤7d | +1 ≤14d | +1 ≤30d  (>30d → skip)
 *   +2  per matching title keyword (max 4 → max +8)
 *   +1  per matching description keyword (max 3 → max +3)
 *   +2  per matching location keyword (max 2 → max +4)
 *
 * Threshold to notify: score ≥ 4
 * Max 3 notifications sent per new item posted.
 */

const Item = require('../models/Item');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/sendEmail');

const STOP_WORDS = new Set([
  'a','an','the','is','was','are','were','in','on','at','to','for','of','and',
  'or','it','my','i','this','that','have','has','had','be','been','from','with',
  'some','any','one','two','three','no','not','by','as','up','do','its','he','she',
]);

function keywords(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

function overlap(str1, str2) {
  const a = new Set(keywords(str1));
  const b = keywords(str2);
  return b.filter(w => a.has(w)).length;
}

function scoreMatch(newItem, candidate) {
  let score = 3; // category already matched

  // Date proximity
  const daysDiff = Math.abs(
    new Date(newItem.date).getTime() - new Date(candidate.date).getTime()
  ) / (1000 * 60 * 60 * 24);

  if (daysDiff > 30) return 0;       // skip pairs more than 30 days apart
  if (daysDiff <= 3)  score += 3;
  else if (daysDiff <= 7)  score += 2;
  else if (daysDiff <= 14) score += 1;
  else                     score += 1; // 15–30 days: still a weak signal

  // Title keyword overlap (weight ×2, capped at 4 matches)
  score += Math.min(overlap(newItem.title, candidate.title), 4) * 2;

  // Description keyword overlap (capped at 3)
  score += Math.min(overlap(newItem.description, candidate.description), 3);

  // Location keyword overlap (weight ×2, capped at 2 matches)
  score += Math.min(overlap(newItem.location, candidate.location), 2) * 2;

  return score;
}

function buildEmailHtml({ recipientName, yourItem, matchedItem, matchedItemStatus, matchUrl }) {
  const isFoundMatch = matchedItemStatus === 'found';
  const headerColor = isFoundMatch ? '#10b981' : '#f59e0b';
  const headerText = isFoundMatch
    ? '🔍 A Found Item Matches Your Lost Report!'
    : '🔍 Someone May Be Looking For What You Found!';

  return `
    <div style="font-family: Inter, sans-serif; max-width:600px; margin:0 auto; background:#020617; color:#f8fafc; padding:32px; border-radius:16px;">
      <div style="text-align:center; margin-bottom:32px;">
        <h1 style="color:${headerColor}; font-size:22px; margin:0 0 8px;">${headerText}</h1>
        <p style="color:#94a3b8; font-size:14px; margin:0;">Campus Item Recovery System</p>
      </div>

      <p style="color:#f8fafc; font-size:15px;">Hi <strong>${recipientName}</strong>,</p>
      <p style="color:#94a3b8; font-size:14px; line-height:1.7;">
        Our matching engine found a potential connection between two reports on CIRS.
        ${isFoundMatch
          ? `Someone recently found an item that may match the <strong style="color:#f8fafc;">${yourItem.title}</strong> you reported as lost.`
          : `Someone just reported losing an item similar to the <strong style="color:#f8fafc;">${yourItem.title}</strong> you found.`
        }
      </p>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:24px 0;">
        <div style="background:#0f172a; padding:20px; border-radius:12px; border:1px solid #1e293b;">
          <p style="color:#64748b; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; margin:0 0 8px;">Your Report</p>
          <p style="color:#f8fafc; font-weight:700; margin:0 0 4px;">${yourItem.title}</p>
          <p style="color:#64748b; font-size:13px; margin:0;">${yourItem.location}</p>
          <p style="color:#64748b; font-size:13px; margin:4px 0 0;">${new Date(yourItem.date).toLocaleDateString()}</p>
        </div>
        <div style="background:#0f172a; padding:20px; border-radius:12px; border:1px solid ${headerColor}44;">
          <p style="color:${headerColor}; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; margin:0 0 8px;">Potential Match</p>
          <p style="color:#f8fafc; font-weight:700; margin:0 0 4px;">${matchedItem.title}</p>
          <p style="color:#64748b; font-size:13px; margin:0;">${matchedItem.location}</p>
          <p style="color:#64748b; font-size:13px; margin:4px 0 0;">${new Date(matchedItem.date).toLocaleDateString()}</p>
        </div>
      </div>

      <div style="text-align:center; margin:32px 0;">
        <a href="${matchUrl}" style="background:#FFD700; color:#002147; padding:14px 32px; text-decoration:none; border-radius:10px; font-weight:800; font-size:14px; display:inline-block; letter-spacing:0.05em;">
          View Matched Item →
        </a>
      </div>

      <p style="color:#475569; font-size:12px; text-align:center; margin-top:32px; border-top:1px solid #1e293b; padding-top:24px;">
        If this match is incorrect, you can ignore this email. CIRS — Campus Item Recovery System.
      </p>
    </div>
  `;
}

/**
 * Run matching for a newly created item.
 * Notifies both sides (person who lost + person who found).
 *
 * @param {Object} newItem  - the newly created Item document (populated with postedBy)
 * @param {string} clientUrl
 */
async function runMatchingForItem(newItem, clientUrl = 'http://localhost:5173') {
  try {
    const oppositeStatus = newItem.status === 'lost' ? 'found' : 'lost';
    const newItemPosterId = newItem.postedBy._id || newItem.postedBy;

    // Fetch candidates: same category, opposite status, not same poster
    const candidates = await Item.find({
      status: oppositeStatus,
      category: newItem.category,
      _id: { $ne: newItem._id },
      postedBy: { $ne: newItemPosterId },
    }).populate('postedBy', 'email fullName _id');

    // Score every candidate
    const scored = candidates
      .map(c => ({ item: c, score: scoreMatch(newItem, c) }))
      .filter(s => s.score >= 4)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3); // top 3 only

    for (const { item: matchedItem } of scored) {
      const matchedPoster = matchedItem.postedBy;
      if (!matchedPoster?._id || !matchedPoster?.email) continue;

      // ── 1. Notify the MATCHED item's poster ──────────────────────────────────
      // Dedup: check if they were already told about this specific new item
      const alreadyNotifiedMatched = await Notification.findOne({
        user: matchedPoster._id,
        type: 'match_found',
        link: `/item/${newItem._id}`,   // link to the new item (what they'll click to)
      });

      if (!alreadyNotifiedMatched) {
        let title, message;
        if (newItem.status === 'found') {
          // new item is found → matched item is lost → notify the loser
          title = '🔍 Possible Match: Someone Found Something Like Yours!';
          message = `A recently found "${newItem.title}" (${newItem.location}) may match your lost "${matchedItem.title}". Check it out and submit a claim if it's yours!`;
        } else {
          // new item is lost → matched item is found → notify the finder
          title = '🔍 Someone May Be Looking For What You Found!';
          message = `Someone just reported losing a "${newItem.title}" near ${newItem.location}, which may match the "${matchedItem.title}" you found. Review the report.`;
        }

        await Notification.create({
          user: matchedPoster._id,
          type: 'match_found',
          title,
          message,
          link: `/item/${newItem._id}`,
        });

        await sendEmail({
          email: matchedPoster.email,
          subject: title,
          message,
          html: buildEmailHtml({
            recipientName: matchedPoster.fullName,
            yourItem: matchedItem,
            matchedItem: newItem,
            matchedItemStatus: newItem.status,
            matchUrl: `${clientUrl}/item/${newItem._id}`,
          }),
        }).catch(err => console.error('[MatchEngine] Email to matched poster failed:', err.message));
      }

      // ── 2. Notify the NEW item's poster — one notification per match ─────────
      // This ensures the loser sees EVERY matching found item, not just the best one
      const alreadyNotifiedNew = await Notification.findOne({
        user: newItemPosterId,
        type: 'match_found',
        link: `/item/${matchedItem._id}`,   // link to each matched item
      });

      if (!alreadyNotifiedNew && newItem.postedBy?.email) {
        const notifyTitle = newItem.status === 'lost'
          ? '✅ Potential match found for your lost item!'
          : '👤 Someone may be looking for the item you found';

        const notifyMsg = newItem.status === 'lost'
          ? `The "${matchedItem.title}" found at ${matchedItem.location} may be your lost "${newItem.title}". Click to view and submit a claim.`
          : `Someone's lost report for "${matchedItem.title}" (${matchedItem.location}) may match the "${newItem.title}" you found. They may contact you soon.`;

        await Notification.create({
          user: newItemPosterId,
          type: 'match_found',
          title: notifyTitle,
          message: notifyMsg,
          link: `/item/${matchedItem._id}`,
        });
      }
    }

    // ── 3. One summary email to the new item's poster (if any matches) ────────
    // Single email listing the best match — avoids spamming multiple emails
    if (scored.length > 0 && newItem.postedBy?.email) {
      const bestMatch = scored[0].item;
      const emailTitle = newItem.status === 'lost'
        ? `✅ We found ${scored.length} potential match(es) for your lost item!`
        : `📋 ${scored.length} person(s) may be looking for the item you found`;
      const emailMsg = newItem.status === 'lost'
        ? `${scored.length} found report(s) match your lost "${newItem.title}". Check them in your notifications and submit a claim!`
        : `${scored.length} lost report(s) match the "${newItem.title}" you found. They may contact you soon.`;

      await sendEmail({
        email: newItem.postedBy.email,
        subject: emailTitle,
        message: emailMsg,
        html: buildEmailHtml({
          recipientName: newItem.postedBy.fullName,
          yourItem: newItem,
          matchedItem: bestMatch,
          matchedItemStatus: bestMatch.status,
          matchUrl: `${clientUrl}/item/${bestMatch._id}`,
        }),
      }).catch(err => console.error('[MatchEngine] Email to new poster failed:', err.message));
    }

    return scored.length;
  } catch (err) {
    console.error('[MatchEngine] Error:', err.message);
    return 0;
  }
}

module.exports = { runMatchingForItem };

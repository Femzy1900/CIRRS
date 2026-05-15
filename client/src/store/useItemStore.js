import { create } from 'zustand';

const DUMMY_ITEMS = [
  {
    id: '1',
    title: 'iPhone 13 Pro',
    description: 'Silver color, found near the cafeteria. It has a cracked screen protector.',
    category: 'Electronics',
    location: 'Central Cafeteria',
    date: '2024-05-08',
    status: 'found',
    image: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&w=800&q=80',
    postedBy: 'John Doe',
    verificationQuestions: [
      { question: 'What color is the phone?', answer: 'Silver' },
      { question: 'What is unique about the screen?', answer: 'Cracked screen protector' },
      { question: 'What is the phone model?', answer: 'iPhone 13 Pro' }
    ],
    contactInfo: { phone: '+234 812 345 6789', email: 'john.doe@campus.edu' }
  },
  {
    id: '2',
    title: 'Leather Wallet',
    description: 'Brown leather wallet containing a student ID and some cash.',
    category: 'Personal Effects',
    location: 'Main Library',
    date: '2024-05-07',
    status: 'lost',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
    postedBy: 'Jane Smith'
  },
  {
    id: '3',
    title: 'Keys with Keychain',
    description: 'Set of 3 keys with a Marvel keychain.',
    category: 'Keys',
    location: 'Science Block',
    date: '2024-05-06',
    status: 'found',
    image: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80',
    postedBy: 'Admin',
    verificationQuestions: [
      { question: 'How many keys are there?', answer: '3' },
      { question: 'What character is on the keychain?', answer: 'Marvel' },
      { question: 'What color is the keychain?', answer: 'Red' },
      { question: 'Is there a car key?', answer: 'No' },
      { question: 'Is the ring silver or gold?', answer: 'Silver' }
    ],
    contactInfo: { phone: '+234 900 111 2222', email: 'security@campus.edu' }
  },
  {
    id: '4',
    title: 'Blue Backpack',
    description: 'Adidas backpack containing textbooks and a calculator.',
    category: 'Bags',
    location: 'Gymnasium',
    date: '2024-05-05',
    status: 'lost',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    postedBy: 'Mike Ross'
  }
];

const useItemStore = create((set) => ({
  items: DUMMY_ITEMS,
  filteredItems: DUMMY_ITEMS,
  loading: false,
  error: null,

  setSearch: (query) => {
    set((state) => ({
      filteredItems: state.items.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
      ),
    }));
  },

  filterByType: (type) => {
    set((state) => ({
      filteredItems: type === 'all' 
        ? state.items 
        : state.items.filter((item) => item.status === type),
    }));
  },

  addItem: (newItem) => {
    const itemWithId = { ...newItem, id: Math.random().toString(36).substr(2, 9) };
    set((state) => ({
      items: [itemWithId, ...state.items],
      filteredItems: [itemWithId, ...state.filteredItems],
    }));
  }
}));

export default useItemStore;

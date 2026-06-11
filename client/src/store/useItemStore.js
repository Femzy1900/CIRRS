import { create } from 'zustand';
import itemApi from '../api/itemApi';

const useItemStore = create((set, get) => ({
  items: [],
  filteredItems: [],
  loading: false,
  error: null,
  singleItem: null,

  fetchItems: async (search = '') => {
    set({ loading: true, error: null });
    try {
      const data = await itemApi.getItems(search ? { search } : {});
      set({ items: data.data, filteredItems: data.data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch items', loading: false });
    }
  },

  fetchItemById: async (id) => {
    set({ loading: true, error: null });
    try {
      const data = await itemApi.getItem(id);
      set({ singleItem: data.data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch item', loading: false });
    }
  },

  setSearch: (query) => {
    // Alternatively you could trigger fetchItems(query) if you want server-side search
    // Doing client-side search for speed, but real app might do server-side
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

  addItem: async (newItemData) => {
    set({ loading: true, error: null });
    try {
      const data = await itemApi.createItem(newItemData);
      const createdItem = data.data;
      set((state) => ({
        items: [createdItem, ...state.items],
        filteredItems: [createdItem, ...state.filteredItems],
        loading: false
      }));
      return createdItem;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add item';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  updateItem: async (id, updatedData) => {
    try {
      const data = await itemApi.updateItem(id, updatedData);
      const updated = data.data;
      set((state) => ({
        items: state.items.map(i => (i._id || i.id) === id ? updated : i),
        filteredItems: state.filteredItems.map(i => (i._id || i.id) === id ? updated : i),
      }));
      return updated;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update item';
      throw new Error(msg);
    }
  },

  deleteItem: async (id) => {
    try {
      await itemApi.deleteItem(id);
      set((state) => ({
        items: state.items.filter(i => (i._id || i.id) !== id),
        filteredItems: state.filteredItems.filter(i => (i._id || i.id) !== id),
      }));
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete item';
      throw new Error(msg);
    }
  },
}));

export default useItemStore;

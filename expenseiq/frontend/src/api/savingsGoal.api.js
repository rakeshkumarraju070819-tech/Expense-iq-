import api from "./axios";

export const getSavingsGoals = () =>
  api.get("/savings-goals").then((r) => r.data);

export const createSavingsGoal = (data) =>
  api.post("/savings-goals", data).then((r) => r.data);

export const updateSavingsGoal = (id, data) =>
  api.put(`/savings-goals/${id}`, data).then((r) => r.data);

export const addContribution = (id, data) =>
  api.post(`/savings-goals/${id}/contribute`, data).then((r) => r.data);

export const deleteSavingsGoal = (id) =>
  api.delete(`/savings-goals/${id}`).then((r) => r.data);

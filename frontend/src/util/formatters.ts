export const formatDate = (dateString) => {
  if (!dateString || dateString === "0001-01-01T00:00:00Z") return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatPrice = (price) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "DZD",
  }).format(price);
};

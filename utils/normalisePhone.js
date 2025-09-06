// utils/normalizePhone.js
function normalizePhone(phone) {
  if (!phone) return phone;
  phone = phone.trim();
  if (phone.startsWith("+")) return phone;
  if (phone.startsWith("0")) return "+234" + phone.slice(1);
  return phone;
}

module.exports = normalizePhone;
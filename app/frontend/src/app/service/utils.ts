export const parseIssueDescription = (desc: string) => {
  if (!desc) return { issue: '-', contact: null };

  // Format 1: issue (Kontak: name - phone)
  const kontakMatch = desc.match(/(.*)\s*\(Kontak:\s*([^-]+)-\s*([^)]+)\)/i);
  if (kontakMatch) {
    return {
      issue: kontakMatch[1].trim(),
      contact: { name: kontakMatch[2].trim(), phone: kontakMatch[3].trim() }
    };
  }

  // Format 2: [Smart Routing Request] Contact: name (phone). Issue: notes
  const legacyMatch = desc.match(/\[Smart Routing Request\]\s*Contact:\s*([^(]+)\(([^)]+)\)\.\s*Issue:\s*(.*)/i);
  if (legacyMatch) {
    return {
      issue: legacyMatch[3].trim(),
      contact: { name: legacyMatch[1].trim(), phone: legacyMatch[2].trim() }
    };
  }

  return { issue: desc, contact: null };
};

export const parseDetailedIssue = (desc: string) => {
  const result = { category: '-', subcategory: '-', remark: '-', contactName: '-', contactPhone: '-' };
  if (!desc) return result;

  const kontakMatch = desc.match(/(.*)\s*\(Kontak:\s*([^-]+)-\s*([^)]+)\)/i);
  let issuePart = desc;
  if (kontakMatch) {
    issuePart = kontakMatch[1].trim();
    result.contactName = kontakMatch[2].trim();
    result.contactPhone = kontakMatch[3].trim();
  } else {
    const legacyMatch = desc.match(/\[Smart Routing Request\]\s*Contact:\s*([^(]+)\(([^)]+)\)\.\s*Issue:\s*(.*)/i);
    if (legacyMatch) {
      result.contactName = legacyMatch[1].trim();
      result.contactPhone = legacyMatch[2].trim();
      issuePart = legacyMatch[3].trim();
    }
  }

  const bracketMatch = issuePart.match(/^\[([^\]-]+)(?:\s*-\s*([^\]]+))?\]\s*(.*)/);
  if (bracketMatch) {
    result.category = bracketMatch[1].trim();
    result.subcategory = bracketMatch[2] ? bracketMatch[2].trim() : '-';
    result.remark = bracketMatch[3] ? bracketMatch[3].trim() : '-';
  } else {
    result.remark = issuePart;
  }

  return result;
};

export const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

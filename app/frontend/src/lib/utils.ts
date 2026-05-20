export function categorizeUnitType(modelName: string): 'SHOWCASE' | 'MESIN' {
  if (!modelName) return 'MESIN';
  
  const lowerName = modelName.toLowerCase();
  
  const showcaseKeywords = [
    'cold case', 
    'combination case', 
    'warm case', 
    'ambient case', 
    'blast freezer', 
    'showcase table'
  ];
  
  for (const keyword of showcaseKeywords) {
    if (lowerName.includes(keyword)) {
      return 'SHOWCASE';
    }
  }
  
  return 'MESIN';
}

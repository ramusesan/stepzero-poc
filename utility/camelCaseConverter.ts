export default class CamelCaseConverter {

    static async toCamelCase(str: string): Promise<string> {
      return str.replace(/(?:^\w|[A-Z]|\b\w|\s+|-)/g, function(match, index) {
        if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
        return index === 0 ? match.toLowerCase() : match === "-" ? "" : match.toUpperCase();
      });
    }
    
    static async keysToCamelCase(obj: any): Promise<any> {
     // console.log("Inside keysToCamelCase", obj);
      if (Array.isArray(obj)) {
        return Promise.all(obj.map(async (v) => await CamelCaseConverter.keysToCamelCase(v)));
      } else if (typeof obj === "object" && obj !== null) {
        const newObj: any = {};
        for (const [key, value] of Object.entries(obj)) {
          newObj[await CamelCaseConverter.toCamelCase(key)] = await CamelCaseConverter.keysToCamelCase(value);
        }
        return newObj;
      } else {
       // console.log("Returning obj");
        return obj;
      }
    }
  
    static async camelCaseToNormalCase(text: string): Promise<string> {
      // Add a space before every uppercase letter preceded by a lowercase letter
      const normalized = text.replace(/([a-z])([A-Z])/g, "$1 $2");
  
      // Convert the string to lowercase and capitalize the first letter of each word
      const words = normalized.toLowerCase().split(" ");
      const capitalizedWords = words.map(
        (word) => word.charAt(0).toUpperCase() + word.slice(1)
      );
  
      // Join the words with spaces and return the result
      return capitalizedWords.join(" ");
    }
    static async getDaysRangeValues(values: any[]): Promise<{ start: number; end: number; }[]> {
      const ranges: { start: number; end: number }[] = [];
    
      for (const value of values) {
        switch (value) {
          case "Within 30 days":
            ranges.push({ start: 0, end: 30 });
            break;
          case "31 to 60 days":
            ranges.push({ start: 31, end: 60 });
            break;
          case "61 to 90 days":
            ranges.push({ start: 61, end: 90 });
            break;
          case "No or expired contract":
            ranges.push({ start: 0, end: 0 });
            break;
          default:
            ranges.push({ start: 0, end: 0 });
            break;
        }
      }
    //"Within 30 days","31 to 60 days","61 to 90 days","No or expired contract"
      return ranges;
    }
    
  }
  
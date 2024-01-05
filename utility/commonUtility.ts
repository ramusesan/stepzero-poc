export default class CommonUtility {
    static async getFirstAndLastDayOfLastMonth(): Promise<any>  {
        // Get the current date
        const currentDate = new Date();
      
        // Calculate the first day of the current month
        const firstDayOfCurrentMonth:any = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
        // Calculate the last day of the previous month
        const lastDayOfLastMonth = new Date(firstDayOfCurrentMonth - 1);

        const firstDayOfLastMonth = new Date(lastDayOfLastMonth.getFullYear(), lastDayOfLastMonth.getMonth(), 1);
      
        // Format dates to ISO format
        const firstDayISO = firstDayOfLastMonth.toISOString().split('T')[0];
        const lastDayISO = lastDayOfLastMonth.toISOString().split('T')[0];
      
        return { firstDay: firstDayISO, lastDay: lastDayISO };
      }
}
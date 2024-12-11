export function getDateInWIB(date: Date){        
    const newHour = date.getHours() + 7
    date.setHours(newHour)
    return date
}
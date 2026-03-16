
export const inputCheckered = () => {

  const inputDateCheaker = (inputer: string) => {
    const d = new Date(inputer);
    if(isNaN(d.getTime())) {
      alert("no date")
      return false
    }
    return true
  }

  return {
    inputDateCheaker
  }
};

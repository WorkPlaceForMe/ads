exports.getStrippedURL = url => {
    let newURL = url
  
    if(newURL.includes('?')){
      newURL = newURL.split('?').shift()
    }
  
    if(newURL.endsWith('/')){
      newURL = newURL.substring(0, newURL.length - 1)
    }
  
    return newURL
  }

  exports.shuffleArray = (arr) => {
    for (let i = arr.length -1; i > 0; i--) {
      j = Math.floor(Math.random() * i)
      k = arr[i]
      arr[i] = arr[j]
      arr[j] = k
    }
  
    return arr
  }
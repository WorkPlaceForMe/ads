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
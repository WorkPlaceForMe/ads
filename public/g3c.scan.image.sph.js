function loadJS(url){
	const scriptTag = document.createElement("script");
	scriptTag.src = url;
	scriptTag.async = false;
	document.head.appendChild(scriptTag);
}

loadJS("https://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js");

let url = document.currentScript.src.substring(0, document.currentScript.src.lastIndexOf('/'))

loadJS(`${url}/g3c.scan.image.sph.without.jquery.js`);
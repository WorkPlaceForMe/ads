
function loadJS(url){
	const scriptTag = document.createElement("script");
	scriptTag.src = url;
	document.head.appendChild(scriptTag);
}

loadJS("https://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js");
loadJS("g3c.scan.image.sph.without.jquery.js");
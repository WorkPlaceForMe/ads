function loadJS(url) {
  const scriptTag = document.createElement("script");
  scriptTag.src = url;
  scriptTag.async = false;
  document.head.appendChild(scriptTag);
}

const url = document.currentScript.src.substring( 0,  document.currentScript.src.lastIndexOf("/"));
const iframe = document.createElement("iframe");
iframe.src = `${url}/iframe.html`;
iframe.style = "display:none";
let userId = "";
if (document.body) {
  document.body.appendChild(iframe);
} else {
  window.addEventListener("load", function () {
    document.body.appendChild(iframe);
  });
}

window.addEventListener("message", function (e) {
  let data = e.data;
  if (data.type && data.type === "userId") {
    userId = data.userId;
    loadJS("https://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js");
    loadJS(`${url}/g3c.scan.image.sph.without.jquery.js`);
  }
});

const db = require('./dbconnection')

exports.convert = (arr) => {
    if(arr == []){
        return;
    }
    let arrResult = [];
    for(const obj of arr){
        // console.log(obj)
        addAd(obj.add.id,obj.add.site, obj.add.date,obj.add.url,obj.add.uid,function(err,rows){
        })
        let item = {
            name: obj.affiliate[1],
            x: obj.vista.boundingBox.left + obj.vista.boundingBox.width/2,
            y: obj.vista.boundingBox.top,
            image: obj.affiliate[2],
            site: obj.affiliate[2].split('/')[2],
            url: obj.affiliate[4],
            price: obj.affiliate[7],
            discounted_price: obj.affiliate[8],
            description: obj.affiliate[6],
            unit: obj.affiliate[18],
            stock: obj.affiliate[9]
        }
        item.site = item.site.split('.')
        item.site.shift()
        item.site = item.site.join('.')
        if(item.x <= 0){
            item.x = 100
        }
        if(item.y <= 0){
            item.y = 100
        }
        
        const adsinfo = [{
            focal_point: [item.x,item.y],
            description: item.description,
            name: item.name,
            url:  item.image,
            product_price: item.price,
            product_price_discounted: item.discounted_price,
            product_url: item.url,
            id: parseInt(Object.values(obj.affiliate)[0]),
            iframe: `<a class="but2" href="${item.url}" target="_blank" rel="noopener noreferrer"><div class="s-expand-height s-include-content-margin s-border-bottom s-latency-cf-section">\r\n\r\n\r\n<span data-component-type="s-product-image" class="rush-component" data-component-id="10">\r\n\r\n<a class="a-link-normal s-no-outline but2" href="${item.url}" target="_blank" rel="noopener noreferrer">\r\n<div align='center' class="a-section aok-relative s-image-square-aspect">\r\n\r\n\r\n\r\n<img src="${item.image}" class="s-image" alt="${item.name}" style='object-fit:contain; width:248px; border: none; box-shadow: 0 0 10px black inset;' srcset="${item.image}" data-image-index="1" data-image-load="" data-image-latency="s-product-image" data-image-source-density="1">\r\n\r\n\r\n</div>\r\n</a>\r\n</span>\r\n\r\n\r\n<div class="a-section a-spacing-none a-spacing-top-small">\r\n\r\n<h4 class="a-size-mini a-spacing-none a-color-base s-line-clamp-4" style="width: 100%; margin-bottom: 10px; margin-top: 10px;">\r\n\r\n\r\n\r\n<a style="max-width: 100%; display: inline-block; font-family: DB Heavent; font-style: normal; font-weight: normal; color: #424242;" class="a-link-normal a-text-normal but2" href="${item.url}" target="_blank" rel="noopener noreferrer">\r\n\r\n\r\n\r\n<span class="a-size-base-plus a-color-base a-text-normal" style="max-width: 100%; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" dir="auto">${item.name}</span>\r\n\r\n\r\n\r\n\r\n</a>\r\n\r\n\r\n</h4>\r\n\r\n</div>\r\n\r\n<div class="a-section a-spacing-none a-spacing-top-micro">\r\n<div class="a-row a-size-small">\r\n\r\n\r\n\r\n\r\n\r\n<span class="a-declarative" data-action="a-popover" data-a-popover="{&quot;max-width&quot;:&quot;700&quot;,&quot;closeButton&quot;:false,&quot;position&quot;:&quot;triggerBottom&quot;,&quot;url&quot;:&quot;/review/widgets/average-customer-review/popover/ref=acr_search__popover?ie=UTF8&amp;asin=B07Q2H7JMM&amp;ref=acr_search__popover&amp;contextId=search&quot;}">\r\n\r\n\r\n\r\n\r\n<div class="a-section a-spacing-none a-spacing-top-micro"><a style="text-decoration:none;" class="a-link-normal a-text-normal but2" href="${item.url}" target="_blank" rel="noopener noreferrer"><span style="color: #71C700; font-size: 40px;font-family: DB Heavent; font-style: normal; font-weight: bold; margin-top: 10px; margin-bottom: 10px;">฿${item.discounted_price}<span style='background:url(http://${obj.serv}/api/pictures/vector2x.png) no-repeat 50% 50%;background-size: 48px;padding: 30px 15px; margin-left: 0px'></span></a>\r\n</div><div class="a-section a-spacing-none a-spacing-top-micro">\r\n<div class="a-row a-size-base a-color-secondary s-align-children-center"><span class="a-size-small a-color-secondary" style="color: #ADADAD; float:left; font-family: DB Heavent; font-style: normal; font-weight: normal;" dir="auto"><s>฿${item.price}</s></span></div>\r\n</div><div class="a-section a-spacing-none a-spacing-top-micro">\r\n<div ><span style="color: #ADADAD; float:right; font-family: DB Heavent; font-style: normal; font-weight: normal;" dir="auto">${item.site}</span></div>\r\n</div>\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n</div>\r\n</div></a>`
        }]
        arrResult.push({adsinfo: adsinfo})
    }
    return arrResult
};

function addAd(name,site,time,imgName,idGeneration,callback){
    return db.query(`INSERT INTO adsPage values (0,'${name}','${site}','${time}','${imgName}','${idGeneration}')`,callback)
}

// font-family: DB Heavent;
// font-style: normal;
// font-weight: bold;
// font-size: 27px;
// line-height: 28px;



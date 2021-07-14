exports.convert = (arr) => {
    if(arr == []){
        return;
    }

    let arrResult = [];
    for(const obj of arr){
        let item = {
            name: obj.affiliate['Merchant Product Name'],
            x: obj.vista.boundingBox.left + obj.vista.boundingBox.width/2,
            y: obj.vista.boundingBox.top - 150,
            image: obj.affiliate['Image URL'],
            url: obj.affiliate['Product URL Web (encoded)'],
            price: obj.affiliate['Price'],
            discounted_price: obj.affiliate['Discounted Price'],
            description: obj.affiliate['Description'],
            unit: obj.affiliate['Price Unit'],
            stock: obj.affiliate['Available']
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
            iframe: `<div class="s-expand-height s-include-content-margin s-border-bottom s-latency-cf-section">\r\n<div class="a-section a-spacing-medium">\r\n\r\n\r\n<div class="a-section a-spacing-micro s-grid-status-badge-container">\r\n\r\n</div>\r\n\r\n\r\n<span data-component-type="s-product-image" class="rush-component" data-component-id="10">\r\n\r\n<a class="a-link-normal s-no-outline but2" href="${item.url}" >\r\n<div class="a-section aok-relative s-image-square-aspect">\r\n\r\n\r\n\r\n<img src="${item.image}" class="s-image" alt="${item.name}" style='object-fit:contain; width:310px; border: none; box-shadow: 0 0 10px black inset;' srcset="${item.image}" data-image-index="1" data-image-load="" data-image-latency="s-product-image" data-image-source-density="1">\r\n\r\n\r\n</div>\r\n</a>\r\n</span>\r\n\r\n\r\n<div class="a-section a-spacing-none a-spacing-top-small">\r\n\r\n<h4 class="a-size-mini a-spacing-none a-color-base s-line-clamp-4">\r\n\r\n\r\n\r\n<a class="a-link-normal a-text-normal but2" href="${item.url}" >\r\n\r\n\r\n\r\n<span class="a-size-base-plus a-color-base a-text-normal" dir="auto">${item.name}</span>\r\n\r\n\r\n\r\n\r\n</a>\r\n\r\n\r\n</h4>\r\n\r\n</div>\r\n\r\n<div class="a-section a-spacing-none a-spacing-top-micro">\r\n<div class="a-row a-size-small">\r\n<span aria-label="${item.stock} Available">\r\n\r\n\r\n\r\n\r\n<span class="a-declarative" data-action="a-popover" data-a-popover="{&quot;max-width&quot;:&quot;700&quot;,&quot;closeButton&quot;:false,&quot;position&quot;:&quot;triggerBottom&quot;,&quot;url&quot;:&quot;/review/widgets/average-customer-review/popover/ref=acr_search__popover?ie=UTF8&amp;asin=B07Q2H7JMM&amp;ref=acr_search__popover&amp;contextId=search&quot;}">\r\n\r\n\r\n\r\n\r\n<div class="a-section a-spacing-none a-spacing-top-micro">\r\n<div class="a-row a-size-base a-color-secondary s-align-children-center"><h3>Discounted Price: ${item.unit} ${item.discounted_price}</h3></div>\r\n</div><div class="a-section a-spacing-none a-spacing-top-micro">\r\n<div class="a-row a-size-base a-color-secondary s-align-children-center"><span class="a-size-small a-color-secondary" dir="auto">Regular Price: ${item.unit} ${item.price}</span></div>\r\n</div><div class="a-section a-spacing-none a-spacing-top-micro">\r\n<div class="a-row a-size-base a-color-secondary s-align-children-center"><span class="a-size-small a-color-secondary" dir="auto">${item.stock} Available</span></div>\r\n</div>\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n</div>\r\n</div>`
        }]
        arrResult.push({adsinfo: adsinfo})
    }
    return arrResult
};
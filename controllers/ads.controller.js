const conf = require('../middleware/prop')
const https = require('https');
const superagent = require('superagent');

exports.getAds = async(req, res) =>{
  try{

  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0
  let vista_url = conf.get('vista_api_url')
  let user = conf.get('vista_api_user')
  let password = conf.get('vista_api_password')
  let url = req.query.url;
  let auth = user+':'+password
  let authB64 = Buffer.from(auth, "utf8").toString('base64')
  console.log(authB64);
  const response = await superagent.post(vista_url + '/grayit/process/image/ondemand')
  .set('Authorization', 'Basic ' + authB64)
  .field('URL', 'url')
  .field('phone', 'My phone')
  console.log(response.body.url);
  console.log(response.body.explanation);
  res.send(response.body); 
}
catch (error) {
  console.trace(error.message)
  console.log(error)
  res.send({
    'results' : [
      {
        adsinfo : [
        {
          'focal_point' : [200, 200],
          "description" : 'WenVen Boys & Girls Cotton Jackets with Removable Hood',
          'name' : 'WenVen Girls Jacket',
          'url' : 'https://images-na.ssl-images-amazon.com/images/I/81Oc%2BhRkUqL._AC_UX679_.jpg',
          'product_price' : 39,
          'product_url' : 'https://www.amazon.com/WenVen-Girls-Cotton-Jackets-Removable/dp/B07BF99FQ2/ref=sr_1_4?dchild=1&keywords=brown+jacket+girl&qid=1615147300&sr=8-4',
          'iframe' : "<div class=\"s-expand-height s-include-content-margin s-border-bottom s-latency-cf-section\">\r\n<div class=\"a-section a-spacing-medium\">\r\n\r\n\r\n<div class=\"a-section a-spacing-micro s-grid-status-badge-container\">\r\n\r\n<\/div>\r\n\r\n\r\n<span data-component-type=\"s-product-image\" class=\"rush-component\" data-component-id=\"10\">\r\n\r\n<a class=\"a-link-normal s-no-outline\" href=\"\/Amazon-Essentials-Full-Zip-High-Pile-X-Large\/dp\/B07Q2H7JMM\/ref=sr_1_1?dchild=1&amp;keywords=brown+jacket+girl&amp;qid=1615147948&amp;sr=8-1\">\r\n<div class=\"a-section aok-relative s-image-square-aspect\">\r\n\r\n\r\n\r\n<img src=\"https:\/\/m.media-amazon.com\/images\/I\/81SSoagYm3L._MCnd_AC_UL320_.jpg\" class=\"s-image\" alt=\"Amazon Essentials Girls' Sherpa Fleece Full-Zip Jacket\" srcset=\"https:\/\/m.media-amazon.com\/images\/I\/81SSoagYm3L._MCnd_AC_UL320_.jpg 1x, https:\/\/m.media-amazon.com\/images\/I\/81SSoagYm3L._MCnd_AC_UL480_FMwebp_QL65_.jpg 1.5x, https:\/\/m.media-amazon.com\/images\/I\/81SSoagYm3L._MCnd_AC_UL640_FMwebp_QL65_.jpg 2x, https:\/\/m.media-amazon.com\/images\/I\/81SSoagYm3L._MCnd_AC_UL800_FMwebp_QL65_.jpg 2.5x, https:\/\/m.media-amazon.com\/images\/I\/81SSoagYm3L._MCnd_AC_UL960_FMwebp_QL65_.jpg 3x\" data-image-index=\"1\" data-image-load=\"\" data-image-latency=\"s-product-image\" data-image-source-density=\"1\">\r\n\r\n\r\n<\/div>\r\n<\/a>\r\n<\/span>\r\n\r\n\r\n<div class=\"a-section a-spacing-none a-spacing-top-small\">\r\n\r\n<h2 class=\"a-size-mini a-spacing-none a-color-base s-line-clamp-4\">\r\n\r\n\r\n\r\n<a class=\"a-link-normal a-text-normal\" href=\"\/Amazon-Essentials-Full-Zip-High-Pile-X-Large\/dp\/B07Q2H7JMM\/ref=sr_1_1?dchild=1&amp;keywords=brown+jacket+girl&amp;qid=1615147948&amp;sr=8-1\">\r\n\r\n\r\n\r\n<span class=\"a-size-base-plus a-color-base a-text-normal\" dir=\"auto\">Amazon Essentials Girls' Sherpa Fleece Full-Zip Jacket<\/span>\r\n\r\n\r\n\r\n\r\n<\/a>\r\n\r\n\r\n<\/h2>\r\n\r\n<\/div>\r\n\r\n<div class=\"a-section a-spacing-none a-spacing-top-micro\">\r\n<div class=\"a-row a-size-small\">\r\n<span aria-label=\"4.7 out of 5 stars\">\r\n\r\n\r\n\r\n\r\n<span class=\"a-declarative\" data-action=\"a-popover\" data-a-popover=\"{&quot;max-width&quot;:&quot;700&quot;,&quot;closeButton&quot;:false,&quot;position&quot;:&quot;triggerBottom&quot;,&quot;url&quot;:&quot;\/review\/widgets\/average-customer-review\/popover\/ref=acr_search__popover?ie=UTF8&amp;asin=B07Q2H7JMM&amp;ref=acr_search__popover&amp;contextId=search&quot;}\">\r\n\r\n<a href=\"javascript:void(0)\" class=\"a-popover-trigger a-declarative\"><i class=\"a-icon a-icon-star-small a-star-small-4-5 aok-align-bottom\"><span class=\"a-icon-alt\">4.7 out of 5 stars<\/span><\/i><i class=\"a-icon a-icon-popover\"><\/i><\/a>\r\n<\/span>\r\n\r\n\r\n\r\n\r\n<\/span>\r\n\r\n<span aria-label=\"1,683\">\r\n\r\n<a class=\"a-link-normal\" href=\"\/Amazon-Essentials-Full-Zip-High-Pile-X-Large\/dp\/B07Q2H7JMM\/ref=sr_1_1?dchild=1&amp;keywords=brown+jacket+girl&amp;qid=1615147948&amp;sr=8-1#customerReviews\">\r\n\r\n\r\n\r\n<span class=\"a-size-base\" dir=\"auto\">1,683<\/span>\r\n\r\n\r\n\r\n\r\n<\/a>\r\n\r\n<\/span>\r\n<\/div>\r\n<\/div>\r\n\r\n\r\n<div class=\"a-section a-spacing-none a-spacing-top-small\">\r\n<div class=\"a-row a-size-base a-color-base\"><div class=\"a-row\"><div class=\"a-row\">\r\n<a class=\"a-size-base a-link-normal a-text-normal\" href=\"\/Amazon-Essentials-Full-Zip-High-Pile-X-Large\/dp\/B07Q2H7JMM\/ref=sr_1_1?dchild=1&amp;keywords=brown+jacket+girl&amp;qid=1615147948&amp;sr=8-1\">\r\n\r\n\r\n\r\n<span class=\"a-price\" data-a-size=\"l\" data-a-color=\"base\"><span class=\"a-offscreen\">$25.00<\/span><span aria-hidden=\"true\"><span class=\"a-price-symbol\">$<\/span><span class=\"a-price-whole\">25<span class=\"a-price-decimal\">.<\/span><\/span><span class=\"a-price-fraction\">00<\/span><\/span><\/span>\r\n\r\n\r\n\r\n\r\n<\/a>\r\n<\/div><\/div><\/div>\r\n<\/div>\r\n\r\n\r\n<div class=\"a-section a-spacing-none a-spacing-top-micro\">\r\n<div class=\"a-row a-size-base a-color-secondary s-align-children-center\"><span class=\"a-size-small a-color-secondary\" dir=\"auto\">Ships to India<\/span><\/div>\r\n<\/div>\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n<\/div>\r\n<\/div>"
        }
      ]
    }
  ]
  })
}
};
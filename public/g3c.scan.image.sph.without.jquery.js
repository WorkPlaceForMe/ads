var styleEl = document.createElement('style')
styleEl.innerHTML =
	'.ui-tooltip-graymatics{background-color: #000033 !important;background:url("");font-size: 14px;font-weight: bold;opacity:0.8; color:#ffffff}; '
document.head.appendChild(styleEl)

const uuid = new Date().getTime()

let sourceJS = new URL(document.currentScript.src)
let serv = sourceJS.origin
let siteEnabled = true

let top1 = 0;
let left1 = 0;
let images;
let imgsTop

$(document).ready(function () {	
	$.ajax({
		url: `${serv}/api/check`,
		type: 'GET',
		async: false,
		data: `site=${window.location.href}&userId=${userId}&sessionId=${sessionId}`,
		dataType: 'json',
		error: function (e) {
			siteEnabled = false
			console.error(e)
		},
		success: function (a) {
			images = a.imgs

			setInterval(
				() => $.ajax({
					url: `${serv}/api/session`,
					type: 'GET',
					async: true,
					data: `sessionId=${sessionId}`,
					dataType: 'json',
					error: function (e) {console.error(e)},
					success: function (a) {
					}
					
				}), 5000)
		}
		
	})
})

$(document).on('mousedown', 'a.but1', function (e) {
	if(e.button == 0 || e.button == 1){
		const data = {
			time: new Date(),
			url: window.location.href,
			type: 1,
			idItem: getIdItem(this),
			img: getImageURL(this),
			userId: userId,
			sessionId: sessionId,
			site: window.location.href
		}

			$.ajax({
			url: `${serv}/api/data`,
			type: 'POST',
			data: data,
			dataType: 'json',
			success: function (a) {
				
			},
			error: function (e) {console.error(e)}
		})
	}
});

$(document).on('mousedown', 'a.but2', function (e) {
	if(e.button == 0 || e.button == 1){
		const data = {
			time: new Date(),
			url: window.location.href,
			type: 2,
			idItem: getIdItem(this),
			img: getImageURL(this),
			userId: userId,
			sessionId: sessionId,
			site: window.location.href
		}
			$.ajax({
			url: `${serv}/api/data`,
			type: 'POST',
			data: data,
			dataType: 'json',
			success: function (a) {
				
			},
			error: function (e) {console.error(e)}
		})
	}
});


$(document).on('click', '.closeBut', function () {
	const wrap = `#markPoint_${$(this)[0].offsetParent.attributes[0].value.split('_')[1]}`
	const button = `#spanPoint_${$(this)[0].offsetParent.attributes[0].value.split('_')[1]}`
	$(button).css('display', ''),
	$(wrap).css('display', 'none')

});


//jQuery plugin to analyse images on website and show context connect ads automatically.|Copyright (c) 2013 GRAYMATICS SG PTE LTD (www.graymatics.com). All rights reserved.|version 0.7
;(function (a, b) {
	function c(b) {
		a.ajax({
			url: `http://api.graymatics.com/grayit/process/image/batch`,
			type: 'POST',
			data: 'API_KEY=' + y + '&URL=' + b + '&Add_Info=[{"source_url":"' + document.URL + '"}]',
			dataType: 'json',
			success: function (a) {
				a.transaction_id && ((TiD = a.transaction_id), console.log(TiD))
			},
			error: function () {}
		})
	}
	function d(b, c, d, e, i) {
		var f = b,
			g = {
				description: f.description,
				product_name: f.name,
				image_url: f.image_url,
				product_price: f.product_price,
				product_url: f.product_url,
				object: f.object,
				iframe: f.iframe,
				id: f.id,
				size: f.imgSize
			}
		// console.log(g)
		if ('indoorroom' != g.object && 'person' != g.object && f.keywords != ' ') {

			let width = 350;
			let posX;
			if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
					if(window.screen.width <= 400){
							width = 330
					}
					if(window.screen.width <= 360){
							width = 300
					}
					posX = 2 + 'vw';
			}else{
				if(c.mx<270){
					c.mx = 400
				}
				posX = c.mx - 120 + 'px';
			}
			if(g.size.w < 400){
				c.mx = 150
				posX = c.mx - 120 + 'px';
			}			
			if(c.my<55){
				c.my = 55
			}
			if(c.my > (g.size.h - 55)){
				c.my = g.size.h - 95
			}
			if(c.mx > (g.size.w - 55)){
				c.mx = g.size.w - 55
				posX = c.mx - 120 + 'px';
			}

			const diffe = 40;
			if(i!=0){
				if(c.mx >= (left1- diffe) && c.mx <= (left1 + diffe) && c.my >= (top1- diffe) && c.my <= (top1 + diffe)){
					if((c.my + 90) > (g.size.h - 55)){
						c.mx = c.mx + 90
					}else{
						c.my = c.my + 90
					}
				}
			}
			var topvl = c.my
			var leftvl = c.mx
			top1 = topvl
			left1 = leftvl
			var h =
				"<a title='SHOP NOW!'class='but1' id ='"+ g.id +"'><div class='mark' id='mark_" + E + "' style='position:absolute;top:" +
				topvl +
				'px;left:' +
				leftvl +
				"px;'><span id='spanPoint_" +
				E +
				"' name='spanPoint_" +
				E +
				"' class='but' style='background:url(" + serv + "/api/pictures/"

				h = h + iconAndSize('iconBorder.gif', false) + "padding: 35px 40px;cursor: pointer; opacity:0.8; '>&nbsp;</span></div></a>"

			a(e).append(h)
			var i = document.createElement('div')
			;(i.innerHTML = g.iframe), (i.id = 'markPoint_' + E++), (i.className = 'wrapper')
			var j =
				`position:absolute;zIndex:50;clear:both;width:${width}px;padding:0.2em;background-color:#FFFFFF;display:none;border: 1px solid gray;-webkit-border-radius: 6px;-moz-border-radius: 6px;border-radius: 6px;-webkit-box-shadow: 0 2px 5px;-moz-box-shadow: 0 2px 5px;box-shadow: 0 2px 5px;`
			i.style.cssText = j
			// var k = a(e).width()
			// console.log(k)
			i.style.top = c.my - 60 + 'px';
			//k / 2 > c.mx ? i.style.left = c.mx - 240 + "px" : i.style.right = k - c.mx - 17 + "px", a(e).append(i);
			(i.style.left = posX ), a(e).append(i)
		}
	}
	let sending = false;
	function e() {
		if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
			a('.mark span').click(
				function () {
					const wrap = `markPoint_${a(this).attr('id').split('_')[1]}`			
					// a(this).css(
					// 	'display',
					// 	'none'
					// ),
						a('.wrapper').css('display', 'none'),
						a('.mark').css('z-index', '100'),
						a(this).css('z-index', '100'),
						a('#' + wrap).css('z-index', '200'),
						a('#' + wrap).css('display', '')
						
				}
			)
		}else{
			a('.but').mouseenter(
				function(e){
					const data = {
						time: new Date(),
						url: window.location.href,
						type: 1,
						idItem: getIdItem(this),
						img: getImageURL(this),
						userId: userId,
						sessionId: sessionId,
						site: window.location.href
					}

					if(sending == false){
						sending = true;
						$.ajax({
						url: `${serv}/api/data`,
						type: 'POST',
						data: data,
						dataType: 'json',
						success: function (a) {
							sending = false;
						},
						error: function (e) {console.error(e)}
						})
					}
					var b =`markPoint_${a(this).attr('name').split('_')[1]}`
					a(this).css(
						'background-size',
						'0px'
					),
					a('.wrapper').css('z-index', '200'),
					a('.mark').css('z-index', '100'),
					a(this).css('z-index', '100'),
					a('#' + b).css('z-index', '250'),
					a('#' + b).css('display', '')
				}
			)
			a('.wrapper').mouseleave(
				function () {
					var b = a(this)[0].id
					a('.but').css(
						'background',
						'url(' + serv + '/api/pictures/iconBorder.gif) no-repeat 40% 40%'
					),
					a('.but').css(
						'background-size',
						'60px'
					),
					a('.but').css(
						'padding',
						'35px 40px'
					),
					a(this).css(
						'cursor',
						'pointer'
					),				
					a('#' + b).css('display', 'none')
				}
			)
		}
	}
	function f(a, c, e) {
		for (var f = a, g = 0; f.length > g; g++)
			if (f[g].adsinfo != b)
				for (var h = 0; f[g].adsinfo.length > h; h++) {
					var i = null,
						j = null,
						k = !1,
						l = f[g].adsinfo[h]

						const diff = 20
						if(g != 0 && l.focal_point[0] >= (f[g - 1].adsinfo[0].focal_point[0]- diff) && l.focal_point[0] <= (f[g - 1].adsinfo[0].focal_point[0] + diff) && l.focal_point[1] >= (f[g - 1].adsinfo[0].focal_point[1]- diff) && l.focal_point[1] <= (f[g - 1].adsinfo[0].focal_point[1] + diff)){
							l.focal_point[1] = l.focal_point[1] + 150
						}

					l.focal_point !== b
						? ((i = (l.focal_point[0] * c.cur_width) / c.ori_width),
						(j = l.focal_point[1] * (c.cur_height / c.ori_height)),
						(k = !0))
						: ((i = c.cur_width - 20 * (h + 1)), (j = 130), (k = !1)),
						(c.mx = i),
						(c.my = j),
						d(l, c, k, e, g)
				}
	}
	function g(b) {
		var c = document.createElement('div')
		c.className = 'ad-image-div'

		if($(b).is('img')){
			c.style.position = 'relative'			
		} else if($(b).is('span')) {
			c = document.createElement('span')
			c.className = 'ad-image-div background-img-class'
		} else {
			c.className = 'ad-image-div background-img-class'
		}

		var d = b.cloneNode(!0)
		return a(d).appendTo(c), b.parentNode.replaceChild(c, b), c
	}
	function k(a) {
		return a.tagName ? ('h1' !== a.tagName.toLowerCase() ? !1 : a.textContent ? !0 : !1) : !1
	}
	function l(a) {
		return a.textContent
	}
	function m(a) {
		for (var b = a; ; ) {
			if (k(b)) return l(b)
			if (!b.parentNode) break
			if (b.parentNode === document) break
			for (var c = jQuery(b).prev(); 0 != c.length; ) {
				if (k(c[0])) return l(c[0])
				for (var d = c.find('h1'), e = 0; d.length > e; ++e) if (k(d[e])) return l(d[e])
				c = jQuery(c).prev()
			}
			b = b.parentNode
		}
		return null
	}
	function n(a) {
		for (var b = a; ; ) {
			if (b.title) return b.title
			if (!b.parentNode) break
			if (b.parentNode == document) break
			b = b.parentNode
		}
		return null
	}
	function p(a) {
		for (var b = a; ; ) {
			if (b.textContent) {
				var c = b.textContent.replace(/\n/g, '').replace(/( )+/g, ' ')
				if ('' != c.replace(/ /g, '')) return 1024 > c.length ? b.textContent : null
			}
			if (!b.parentNode) break
			if (b.parentNode == document) break
			b = b.parentNode
		}
		return null
	}
	function q(a, b) {
		var c = new u(b),
			d = new t(),
			e = s(c, d, a.alt)
		return e
			? e
			: (e = s(c, d, n(a)))
			? e
			: (e = s(c, d, p(a)))
			? e
			: ((e = s(c, d, m(a))), e ? e : null)
	}
	function r(a) {
		var b = q(a, 'age'),
			c = q(a, 'type')
		return b ? (c ? b + '/' + c : b) : c ? '/' + c : null
	}
	function s(a, b, c) {
		if (!c) return null
		for (var d = '', e = 0; c.length > e; ++e) {
			var f = c.charAt(e)
			d += (f >= 'a' && 'z' >= f) || (f >= 'A' && 'Z' >= f) || (f >= '0' && '9' >= f) ? f : ';'
		}
		d = d.toLowerCase()
		for (var g = d.split(';'), e = 0; g.length > e; ++e) {
			var h = a.getGroup(g[e])
			h && b.add(h)
		}
		var d = b.getMax()
		return d
	}
	;
	let num = 0;
	(a.GM = {}),
		(a.GM.IMLayer = function (a, b, width, height) {
				this.imgsrc = a
				this.celement = b

				if(width){
					this.cur_width = width
				} else {
					this.cur_width = b.width
				}
				if(height){
					this.cur_height = height
				} else {
					this.cur_height = b.height
				}
		}),
		a.extend(a.GM.IMLayer.prototype, {
			imageProcess: function () {
				var h = {
					cur_width: (this.cur_width ? this.cur_width : 170),
					cur_height: (this.cur_height ? this.cur_height : 120)
				}
				if (!(150 > h.cur_width || 100 > h.cur_height)) {
					'__gm__' + a.now()
					var j = r(this.celement)
					j || (j = '')
					var k = g(this.celement),
						l = this.imgsrc
					if(l.split('/')[0] == 'http:' || l.split('/')[0] == 'https:'){
						l = this.imgsrc
					}else if(l.startsWith("//")){
						l = `https://${this.imgsrc.split('//')[1]}`
					}else if(l.startsWith("..")){
						let sitee = window.location.href
						let a = sitee.split('/')
						a.pop()
						a.pop()
						l = `${a.join('/')}${this.imgsrc.split('..')[1]}`
					}else if(l.startsWith(".")){
						let sitee = window.location.href
						let a = sitee.split('/')
						a.pop()
						l = `${a.join('/')}${this.imgsrc.split('.')[1]}.${this.imgsrc.split('.')[2]}`
					}else{
						let sitee = window.location.href
						let a = sitee.split('/')
						a.pop()
						l = `${a.join('/')}/${this.imgsrc}`
					}
					let mobile = 0;
					if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
						mobile = 1
					}
					var m =
							'ad_type=' +
							z +
							'&img_width=' +
							h.cur_width +
							'&img_height=' +
							h.cur_height +
							'&ad_format=' +
							C +
							'&media_type=' +
							w +
							'&url=' +
							encodeURIComponent(l)  +
							'&site=' +
							encodeURIComponent(pe) + 
							'&uid=' +
							uuid + 
							'&serv=' +
							serv +
							'&mobile=' +
							mobile +
							'&userId=' +
							userId +
							"&sessionId=" + sessionId,
					num = num + 1

					if(siteEnabled){
						a.ajax({
							url: v,
							type: 'GET',
							data: m,
							dataType: 'json',
							success: function (a) {
								if ('false' == a.status) return c(l), b
								var d = new Image();						
								d.onload = function () {
									h.ori_width = d.width;
									h.ori_height = d.height;								
									f(a.results, h, k);
									e(h);
								}
								d.src = l;
							},
							error: function () {}
						})
					}
				}else{
					imgsTop++
				}
			}
		})
	var t = function () {
			var a = {}
			;(this.add = function (b) {
				a[b] = b in a ? a[b] + 1 : 1
			}),
				(this.getCount = function (b) {
					return b in a ? a[b] : 0
				}),
				(this.getMax = function () {
					var b = null
					for (var c in a) b ? a[c] > a[b] && (b = c) : (b = c)
					for (var c in a) if (c != b && a[c] >= a[b]) return null
					return b
				})
		},
		u = function (a) {
			var b = {}
			;(this.addGroup = function (a) {
				for (var c = a.split(','), d = 0; c.length > d; ++d) b[c[d]] = c[0]
			}),
				(this.getGroup = function (a) {
					return a in b ? b[a] : null
				}),
				'age' == a
					? (this.addGroup('women,woman,lady,ladies,female'),
					  this.addGroup('men,man,guy,guys,gentlemen, gentleman,male'),
					  this.addGroup('baby,babies'),
					  this.addGroup('kid,kids'),
					  this.addGroup('girl,girls'),
					  this.addGroup('boy,boys'),
					  this.addGroup('senior,seniors,old people,old person,elder,elders'),
					  this.addGroup('juniors,junior,teen,teenage'))
					: 'type' == a &&
					  (this.addGroup('top,tops,tee,tees,tshirt,tshirts,t-shirt,t-shirts'),
					  this.addGroup('sweater,sweaters'),
					  this.addGroup('hoodie,hoodies,sweatshirt,sweatshirts'),
					  this.addGroup('dress,dresses'),
					  this.addGroup('jeans'),
					  this.addGroup('pant,pants,trouser,trousers'),
					  this.addGroup('capris'),
					  this.addGroup('skirt,skirts'),
					  this.addGroup('legging,leggings'),
					  this.addGroup('short,shorts'),
					  this.addGroup('blazer,blazers'),
					  this.addGroup('jacket,jackets'),
					  this.addGroup('suits,suit,tuxedo,tuxedos'),
					  this.addGroup('coat,coats'))
		},
		v = `${serv}/api/v1/ads`,
		w = 'image',
		z = 'image',
		A = 240,
		B = 95,
		C = '240x95_as',
		E = 0,
		pe = window.location.href
		
		$(document).ready(function () {

			setTimeout(() => {
				if(!siteEnabled){
					return false
				}

				var b = []
				$('div:visible, span:visible').filter(function() {
					return ($(this).css("backgroundImage") && $(this).css("backgroundImage") != 'none' && $(this).css("visibility") != 'hidden' && isElementInViewPort(this))
				}).each(function() {
					let imageURL = $(this).css("backgroundImage").replace('url(','').replace(')','').replace(/\"/gi, "")
					b.push(new a.GM.IMLayer(imageURL, a(this)[0], $(this).width(), $(this).height()))
				})
				
				a('img:visible').filter(function() {
					 return ($(this).css("visibility") != 'hidden' && isElementInViewPort(this))
				}).each(function() {
					b.push(new a.GM.IMLayer($(this).prop('src'), a(this)[0]))
				})
				
				b.forEach(function (item) {
					item.imageProcess()
				})
		}, 50)
	})
})(jQuery)

function iconAndSize(file, big){
	let size, rep;
	if(big == true){
		size = 80;
		rep = 50
		if(file == 'iconShadow.gif'){
			size = 100;
			rep = 70
		}
	}else{
		size = 60;
		rep = 40;
	}
	const str = `${file}) no-repeat ${rep}% ${rep}%;background-size: ${size}px;`
	return str
}

function isElementInViewPort(element){
	let bounding = element.getBoundingClientRect()
	const viewportWidth = window.innerWidth || document.documentElement.clientWidth
	
	if (bounding.top >= 0 && bounding.bottom > 0 && bounding.right <= viewportWidth) {
		return true
	} else {
		return false
	}
}

function getImageURL(element){
	let imageURL = $(element).closest('.ad-image-div').find('img').prop('src')

	if($(element).closest('.background-img-class').length > 0){
		$(element).closest('.background-img-class').find('a, span, div').filter(function() {
			return this.style.backgroundImage
		}).each(function() {
			imageURL = $(this).css("backgroundImage").replace('url(','').replace(')','').replace(/\"/gi, "")
			return false
		})
	}

	return imageURL
}

function getIdItem(element){
	let idItem = $(element).closest('a.but1').attr('id')

	if($(element).is('a.but')){
		idItem = $(element).closest('a.but1').attr('id')
	}

	if($(element).is('a.but1')){
		idItem = $(element).attr('id')
	}

	if($(element).is('a.but2')){
		idItem = $(element).closest('div.wrapper').prev('a.but1').attr('id')
	}

	if(!idItem){
		idItem = $(element).closest('.ad-image-div').find('a').attr('id')
	}

	return idItem
}
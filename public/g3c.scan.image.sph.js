/* eslint-disable no-mixed-spaces-and-tabs */
var styleEl = document.createElement('style')
styleEl.innerHTML =
	'.ui-tooltip-graymatics{background-color: #000033 !important;background:url("");font-size: 14px;font-weight: bold;opacity:0.8; color:#ffffff}; '
document.head.appendChild(styleEl)

const uuid = new Date().getTime()

let serv = document.currentScript.getAttribute('src').split('/')
serv = `${serv[0]}//${serv[2]}`


$(document).ready(function () {
	$.ajax({
		url: `${serv}/api/check`,
		type: 'GET',
		data: `site=${window.location.href}`,
		dataType: 'json',
		success: function (a) {
			
		},
		error: function (e) {console.error(e)}
	})
})

$(document).on('mousedown', 'a.but1', function (e) {
	if(e.button == 0 || e.button == 1){
		const data = {
			time: new Date(),
			url: window.location.href,
			type: 1,
			idItem: e.currentTarget.id,
			img: e.originalEvent.path[3].children[0].currentSrc
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
		let idItem, img;
		if(navigator.userAgent.indexOf("Firefox") != -1 ) {
			idItem = e.srcElement.parentNode.parentNode.parentNode.parentNode.parentNode.childNodes[1].id;
			img = e.srcElement.parentNode.parentNode.parentNode.parentNode.parentNode.childNodes[0].currentSrc;
		}else{
			idItem = parseInt(decodeURI(e.originalEvent.path[2].href).split('id=')[1]) || parseInt(decodeURI(e.originalEvent.path[1].href).split('id=')[1]);
			img = e.originalEvent.path[5].children[0].currentSrc || e.originalEvent.path[6].children[0].currentSrc;
		}
		const data = {
			time: new Date(),
			url: window.location.href,
			type: 2,
			idItem: idItem,
			img: img
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
	function d(b, c, d, e) {
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
		if ('indoorroom' != g.object && 'person' != g.object && f.keywords != ' ') {
			if(c.my<55){
				c.my = 55
			}
			if(c.my > (g.size.h - 55)){
				c.my = g.size.h - 55
			}
			let width = 350;
			let posX = c.mx - 120 + 'px';
			if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
					if(window.screen.width <= 350){
							width = window.screen.width
					}
					posX = 2 + 'vw';
			}else{
				if(c.mx<270){
				c.mx = 270
			}
			}
			if(c.mx > (g.size.w - 55)){
				c.mx = g.size.w - 55
			}
			var topvl = c.my
			var leftvl = c.mx
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

				h = h + iconAndSize('iconBorder.gif', false) + "padding: 35px 40px;cursor: pointer;'>&nbsp;</span></div></a>"

			a(e).append(h)
			var i = document.createElement('div')
			;(i.innerHTML = g.iframe), (i.id = 'markPoint_' + E++), (i.className = 'wrapper')
			var j =
				`position:absolute;zIndex:50;clear:both;width:${width}px;padding:0.2em;background-color:#FFFFFF;display:none;border: 1px solid gray;-webkit-border-radius: 6px;-moz-border-radius: 6px;border-radius: 6px;-webkit-box-shadow: 0 2px 5px;-moz-box-shadow: 0 2px 5px;box-shadow: 0 2px 5px;`
			i.style.cssText = j
			var k = a(e).width()
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
					a(this).css(
						'display',
						'none'
					),
						a('.wrapper').css('z-index', '50'),
						a('.mark').css('z-index', '200'),
						a(this).css('z-index', '200'),
						a('#' + wrap).css('z-index', '100'),
						a('#' + wrap).css('display', '')
						
				}
			)
		}else{
			a('.but').mouseenter(
				function(e){
					console.log(e)
					const data = {
						time: new Date(),
						url: window.location.href,
						type: 1,
						idItem: e.currentTarget.parentNode.parentNode.id,
						img: e.currentTarget.parentNode.parentNode.parentNode.children[0].currentSrc
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
					a('.wrapper').css('z-index', '250'),
					a('.mark').css('z-index', '200'),
					a(this).css('z-index', '200'),
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
					l.focal_point !== b
						? ((i = (l.focal_point[0] * c.cur_width) / c.ori_width),
						  (j = l.focal_point[1] * (c.cur_height / c.ori_height)),
						  (k = !0))
						: ((i = c.cur_width - 20 * (h + 1)), (j = 130), (k = !1)),
						(c.mx = i),
						(c.my = j),
						d(l, c, k, e)
				}
	}
	function g(b) {
		var c = document.createElement('div')
		c.style.position = 'relative'
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
		(a.GM.IMLayer = function (a, b) {
			;(this.imgsrc = a),
				(this.celement = b),
				(this.cur_width = b.width),
				(this.cur_height = b.height)
		}),
		a.extend(a.GM.IMLayer.prototype, {
			imageProcess: function () {
				var h = {
					cur_width: this.cur_width,
					cur_height: this.cur_height
				}
				if (!(200 > h.cur_width || 200 > h.cur_height)) {
					'__gm__' + a.now()
					var j = r(this.celement)
					j || (j = '')
					var k = g(this.celement),
						l = this.imgsrc
					if(l.split('/')[0] == 'http:' || l.split('/')[0] == 'https:'){
						l = this.imgsrc
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
							l +
							'&site=' +
							pe + 
							'&uid=' +
							uuid + 
							'&serv=' +
							serv +
							'&mobile=' +
							mobile
					num = num + 1
					a.ajax({
						url: v,
						type: 'GET',
						data: m,
						dataType: 'json',
						success: function (a) {
							if ('false' == a.status) return c(l), b
							var d = new Image()
							;(d.onload = function () {
								;(h.ori_width = d.width), (h.ori_height = d.height), f(a.results, h, k), e(h)
							}),
								(d.src = l)
						},
						error: function () {}
					})
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
	window.onload = function () {
		var b = []
		for (
			a('img').each(function () {
				b.push(new a.GM.IMLayer(a(this).attr('src'), a(this)[0]))
			}),
				i = 0;
			b.length > i;
			i++
		)
			b[i].imageProcess()
	}
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

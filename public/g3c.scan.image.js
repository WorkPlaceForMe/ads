/* jQuery plugin to analyse images on website and show context connect ads automatically.|Copyright (c) 2013 GRAYMATICS SG PTE LTD (www.graymatics.com). All rights reserved.|version 0.7*/
(function (a, b) {
    function c(b) {
        a.ajax({
            //url: "http://api.graymatics.com/grayit/process/image/batch",
            url: api_url + "/grayit/process/image/batch",
            type: "POST",
            data: "URL=" + b+ '&Add_Info=[{"source_url":"'+document.URL+'"}]',
            dataType: "json",
            beforeSend: function (xhr){ 
                xhr.setRequestHeader('Authorization', 'Basic ' + btoa(g3c_user +':'+g3c_password)); 
            },
            success: function (a) {
                a.transaction_id && (TiD = a.transaction_id, console.log(TiD))
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
                iframe: f.iframe
            };
        if ("indoorroom" != g.object && "person" != g.object && f.keywords != " ") {
            var h = "<div name='mark_point_" + E + "' class='mark' style='position:absolute;top:" + c.my + "px;left:" + c.mx + "px;background:url(http://scripts.graymatics.com/image/plus.png);width:32px;height:32px;'></div>";
            a(e).append(h);
            var i = document.createElement("div");
            i.innerHTML = g.iframe, i.id = "mark_point_" + E++, i.className = "wrapper";
            var j = "position:absolute;zIndex:100;clear:both;width:240px;height:95px;padding:0.5em;background-color:#8dd8f8;display:none;border: 1px solid gray;-webkit-border-radius: 6px;-moz-border-radius: 6px;border-radius: 6px;-webkit-box-shadow: 0 2px 5px;-moz-box-shadow: 0 2px 5px;box-shadow: 0 2px 5px;";
            i.style.cssText = j;
            var k = a(e).width();
            i.style.top = c.my + 20 + "px", k / 2 > c.mx ? i.style.left = c.mx + 16 + "px" : i.style.right = k - c.mx - 17 + "px", a(e).append(i)
        }
    }
    function e() {
        a(".mark").toggle(function () {
            var b = a(this).attr("name");
            a(this).css("background", "url(http://scripts.graymatics.com/image/minus.png)"), a(".wrapper").css("z-index", "50"), a(".mark").css("z-index", "60"), a(this).css("z-index", "200"), a("#" + b).css("z-index", "100"), a("#" + b).css("display", "")
        }, function () {
            var b = a(this).attr("name");
            a(this).css("background", "url(http://scripts.graymatics.com/image/plus.png)"), a("#" + b).css("display", "none")
        })
    }
    function f(a, c, e) {
        for (var f = a, g = 0; f.length > g; g++) if (f[g].adsinfo != b) for (var h = 0; f[g].adsinfo.length > h; h++) {
                    var i = null,
                        j = null,
                        k = !1,
                        l = f[g].adsinfo[h];
                    l.focal_point !== b ? (i = l.focal_point[0] * c.cur_width / c.ori_width, j = l.focal_point[1] * c.cur_height / c.ori_height, k = !0) : (i = c.cur_width - 50 * (h + 1), j = 0, k = !1), c.mx = i, c.my = j, d(l, c, k, e)
            }
    }
    function g(b) {
        var c = document.createElement("div");
        c.style.position = "relative";
        var d = b.cloneNode(!0);
        return a(d).appendTo(c), b.parentNode.replaceChild(c, b), c
    }
    function k(a) {
        return a.tagName ? "h1" !== a.tagName.toLowerCase() ? !1 : a.textContent ? !0 : !1 : !1
    }
    function l(a) {
        return a.textContent
    }
    function m(a) {
        for (var b = a;;) {
            if (k(b)) return l(b);
            if (!b.parentNode) break;
            if (b.parentNode === document) break;
            for (var c = jQuery(b).prev(); 0 != c.length;) {
                if (k(c[0])) return l(c[0]);
                for (var d = c.find("h1"), e = 0; d.length > e; ++e) if (k(d[e])) return l(d[e]);
                c = jQuery(c).prev()
            }
            b = b.parentNode
        }
        return null
    }
    function n(a) {
        for (var b = a;;) {
            if (b.title) return b.title;
            if (!b.parentNode) break;
            if (b.parentNode == document) break;
            b = b.parentNode
        }
        return null
    }
    function p(a) {
        for (var b = a;;) {
            if (b.textContent) {
                var c = b.textContent.replace(/\n/g, "").replace(/( )+/g, " ");
                if ("" != c.replace(/ /g, "")) return 1024 > c.length ? b.textContent : null
            }
            if (!b.parentNode) break;
            if (b.parentNode == document) break;
            b = b.parentNode
        }
        return null
    }
    function q(a, b) {
        var c = new u(b),
            d = new t,
            e = s(c, d, a.alt);
        return e ? e : (e = s(c, d, n(a))) ? e : (e = s(c, d, p(a))) ? e : (e = s(c, d, m(a)), e ? e : null)
    }
    function r(a) {
        var b = q(a, "age"),
            c = q(a, "type");
        return b ? c ? b + "/" + c : b : c ? "/" + c : null
    }
    function s(a, b, c) {
        if (!c) return null;
        for (var d = "", e = 0; c.length > e; ++e) {
            var f = c.charAt(e);
            d += f >= "a" && "z" >= f || f >= "A" && "Z" >= f || f >= "0" && "9" >= f ? f : ";"
        }
        d = d.toLowerCase();
        for (var g = d.split(";"), e = 0; g.length > e; ++e) {
            var h = a.getGroup(g[e]);
            h && b.add(h)
        }
        var d = b.getMax();
        return d
    }
    a.GM = {}, a.GM.IMLayer = function (a, b) {
        this.imgsrc = a, this.celement = b, this.cur_width = b.width, this.cur_height = b.height
    }, a.extend(a.GM.IMLayer.prototype, {
        imageProcess: function () {
            var h = {
                cur_width: this.cur_width,
                cur_height: this.cur_height
            };
            if (!(200 > h.cur_width || 200 > h.cur_height)) {
                "__gm__" + a.now();
                var j = r(this.celement);
                j || (j = "");
                var k = g(this.celement),
                    l = this.imgsrc,
                    m = "pub_id=" + "&ad_type=" + z + "&ad_width=" + A + "&ad_height=" + B + "&ad_format=" + C + "&media_type=" + w + "&url=" + l;
                a.ajax({
                    url: v,
                    type: "GET",
                    data: m,
                    dataType: "json",
                    beforeSend: function (xhr){ 
                        xhr.setRequestHeader('Authorization', 'Basic ' + btoa(g3c_user +':'+g3c_password)); 
                    },
                    success: function (a) {
                        if ("false" == a.status) return c(l), b;
                        var d = new Image;
                        d.onload = function () {
                            h.ori_width = d.width, h.ori_height = d.height, f(a.results, h, k), e(h)
                        }, d.src = l
                    },
                    error: function () {
                        return c(l), b
                    }
                })
            }
        }
    });
    var t = function () {
        var a = {};
        this.add = function (b) {
            a[b] = b in a ? a[b] + 1 : 1
        }, this.getCount = function (b) {
            return b in a ? a[b] : 0
        }, this.getMax = function () {
            var b = null;
            for (var c in a) b ? a[c] > a[b] && (b = c) : b = c;
            for (var c in a) if (c != b && a[c] >= a[b]) return null;
            return b
        }
    }, u = function (a) {
            var b = {};
            this.addGroup = function (a) {
                for (var c = a.split(","), d = 0; c.length > d; ++d) b[c[d]] = c[0]
            }, this.getGroup = function (a) {
                return a in b ? b[a] : null
            }, "age" == a ? (this.addGroup("women,woman,lady,ladies,female"), this.addGroup("men,man,guy,guys,gentlemen, gentleman,male"), this.addGroup("baby,babies"), this.addGroup("kid,kids"), this.addGroup("girl,girls"), this.addGroup("boy,boys"), this.addGroup("senior,seniors,old people,old person,elder,elders"), this.addGroup("juniors,junior,teen,teenage")) : "type" == a && (this.addGroup("top,tops,tee,tees,tshirt,tshirts,t-shirt,t-shirts"), this.addGroup("sweater,sweaters"), this.addGroup("hoodie,hoodies,sweatshirt,sweatshirts"), this.addGroup("dress,dresses"), this.addGroup("jeans"), this.addGroup("pant,pants,trouser,trousers"), this.addGroup("capris"), this.addGroup("skirt,skirts"), this.addGroup("legging,leggings"), this.addGroup("short,shorts"), this.addGroup("blazer,blazers"), this.addGroup("jacket,jackets"), this.addGroup("suits,suit,tuxedo,tuxedos"), this.addGroup("coat,coats"))
      //  }, v = "http://grayds.graymatics.com/gmads/",
        }, v = api_url + "/gmads/",
        w = "image",
        z = "image",
        A = 240,
        B = 95,
        C = "240x95_as",
        E = 0;
    window.onload = function () {
        var b = [];
        for (a("img").each(function () {
            b.push(new a.GM.IMLayer(a(this).attr("src"), a(this)[0]))
        }), i = 0; b.length > i; i++) b[i].imageProcess()
    }
})(jQuery);

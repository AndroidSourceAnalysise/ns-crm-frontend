<template>
    <div class="container" :class="pageClass">
        <frame-header :menu-list="topMenu" :user-info="userInfo" :domain-name="domainName"></frame-header>
        <div class="content-wrap">
            <frame-left :left-menu="leftMenu"></frame-left>
            <div class="body-content">
                <slot name="body-content"></slot>
            </div>
        </div>
        <frame-footer :copy-right="copyRight"></frame-footer>
    </div>
</template>

<style lang="less">
    .container {
        background-color: #f3f3f4;
        .content-wrap {
            width: 1318px;
            margin: 0 auto;
            padding: 0;
            font-size: 0;
        }
        .body-content {
            display: inline-block;
            width: 1124px;
            min-height: 960px;
            padding: 0 0 40px;
            font-size: 12px;
            background-color: #fff;
        }
        .ac {
            text-align: center;
        }
    }
</style>

<script>
    var head = require('./header'),
        left = require('./left-menu'),
        footer = require('./footer'),
        axios = require('libs/axios-proxy'),
        jsonp = require('libs/jsonp'),
	    util = require('common/js/util'),
        tongji = require('common/js/tongji'),
        reset = require('common/styles/reset.css'),
        common = require('common/styles/common.scss'),
        font = require('common/styles/font-awesome.css'),
        sprite = require('common/styles/frame-work-sprite.css');

    function transformTopMenu(menu) {
        var rs = {};

        rs.isActive = menu.active;
        rs.target = menu.target;
        rs.jumpUrl = menu.url;
        rs.name = menu.name;

        return rs;
    }
    function recordCurUri() {
	    localStorage.setItem('shpt-latest-uri', location.href);
	    window.addEventListener('hashchange', function () {
		    localStorage.setItem('shpt-latest-uri', location.href);
	    }, false);
    }
    module.exports = {
        data: function() {
            var self = this;

            return {
                leftMenu: {
                    curTopMenuName: '',
                    list: []
                },
                topMenu: [],
                userInfo: {
                    shopBranch: null,
                    shopSubGroup: null,
                    shop: {
                        logoUrl: '',
                        tel: '',
                        name: ''
                    },
                    logoUrl: '',
                    shopInfoUrl: '',
                    detailList: [],
                    hasBeibaoPermission: false,
					unreadMessageCount: 0,
                    hasPackageExpire: false
                },
	            domainName: '',
                copyRight: ''
            };
        },
        props: {
            pageClass: {
                type: String
            }
        },
        components: {
            'frame-header': head,
            'frame-left': left,
            'frame-footer': footer
        },
        methods: {
        	init: function () {
                var _json = require('root/environment-domain.json');

                this.domainName = 'http://' + _json.domianName;
	        }
        },
        created: function() {
            var self = this,
                response,
                datas,
                l,
                domainName,
                topMenu,
                targetUri;

            //targetUri = localStorage.getItem('curURI') || '/home';
	        targetUri = util.getUrlInfo(location.href).pathname.replace(/\/[^\/]+(\/[^\/]+?.*)/, '$1');
            self.init();
	        domainName = self.domainName;
	        self.userInfo.detailList = [
		        {name: '商家套餐', url: self.domainName + '/saofu-shop-shop/syscfg/overview/shanghu-overview', val: '商户概况', icon: 'icon-package'},
		        {name: '我的SIM卡', url: self.domainName + '/saofu-shop-shop/syscfg/overview/shanghu-overview', val: self.simCard + '张可用', icon: 'icon-sim-card'}
	        ];
            axios.post(domainName + '/saofu-shop-shop/menu/list', {
                uri: targetUri
            }).then(function(res) {
                response = res.data;
                datas = response.attach;
                if(response.success){
                    l = datas.length;
                    while(l--) {
                        topMenu = transformTopMenu(datas[l]);
                        self.topMenu.unshift(topMenu);
                        if(datas[l].active && datas[l].subMenus) {
                            self.leftMenu.list = datas[l].subMenus;
                            self.leftMenu.curTopMenuName = topMenu.name;
                        }
                    }
                    recordCurUri();
                }else{
                    console.log(response.message);
                }
            });
            axios.post(domainName + '/saofu-shop-shop/menu/top').then(function(res) {
                //获取用户信息
                response = res.data;
                datas = response.attach;
                if(response.success){
                    self.userInfo.shopBranch = datas.shopBranch;
                    self.userInfo.shopSubGroup = datas.shopSubGroup;
                    self.userInfo.detailList[0].val = datas.shopPackName || '商户概况';
                    self.userInfo.shopInfoUrl = datas.__saofu_shop_url;
                    self.userInfo.hasBeibaoPermission = datas.permissionBeibao;
                    self.userInfo.hasPackageExpire = datas.permissionPackageHasExpire;
                    if(self.userInfo.hasBeibaoPermission) {
	                    self.userInfo.detailList.splice(1, 0, {
		                    name: '我的贝宝',
		                    val: '0个贝宝',
		                    url: domainName + '/saofu-shop-shop/marketingtool/web-paycenter',
		                    icon: 'icon-paypal'
	                    });
                    }
                    if(datas.shop) {
                    	//商户后台系统loogo
                    	self.userInfo.logoUrl = datas.fullBannerUrl;
                    	//商户头像
                        self.userInfo.shop.headImg = datas.fullLogoUrl;
                        self.userInfo.shop.account = datas.principal;
                        self.userInfo.shop.name = datas.shop.name;
                    }
                }
            }).then(function() {
                if(self.userInfo.hasBeibaoPermission){
                    jsonp(domainName + '/saofu-shop-shop/syscfg/beibao/num', {
                        param: 'jsonpcallback'
                    }, function(err, res) {
                        //获取贝宝数量
                        if(res.success){
                            self.userInfo.detailList[1].val = res.attach + '个宝贝';
                        }
                    });
                }
                if(self.userInfo.shopBranch === null && self.userInfo.shopSubGroup === null){
                    jsonp(domainName + '/saofu-shop-shop/syscfg/shopsim/num', {
                        param: 'jsonpcallback'
                    }, function(err, res) {
                        //获取sim卡数量
                        if(res.success){
                            self.userInfo.detailList[2].val = res.attach + '张可用';
                        }
                    });
                }
				if(self.userInfo.hasPackageExpire) {
					jsonp(domainName + '/saofu-shop-shop/shop_message/get_unread_count', {
						param: 'jsonpcallback'
					}, function(err, res) {
						//获取未读消息数量
						if(res.success){
							self.userInfo.unreadMessageCount = res.attach.count;
						}
					});
				}
            });
            axios.post(domainName + '/saofu-shop-shop/menu/footer').then(function(res) {
                if(res.data.success){
                    self.copyRight = res.data.attach.shopCopyright;
                }
            });
        }
    };
</script>
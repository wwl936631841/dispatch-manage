/**
 * 配置编译环境和线上环境之间的切换
 * baseUrl: 域名地址
 */
let baseUrl = ''; 
let processUrl = process.env.BASE_API;
if (process.env.NODE_ENV == 'development') {
	baseUrl = 'http://api-gateway.cba0c8564f4854aee954cc244799b71ab.cn-shenzhen.alicontainer.com/poly-arrears-backend-for-frontends';
}else if(process.env.NODE_ENV == 'production'){
	console.log('production')
	baseUrl = 'https://gateway.shenzhenpoly.com/poly-arrears-backend-for-frontends';
}else if(process.env.NODE_ENV == 'test'){
	console.log('test')
	baseUrl = 'http://api-gateway.cba0c8564f4854aee954cc244799b71ab.cn-shenzhen.alicontainer.com/poly-arrears-backend-for-frontends';
}else if(process.env.NODE_ENV == 'uat'){
	baseUrl = 'http://api-gateway-uat.cba0c8564f4854aee954cc244799b71ab.cn-shenzhen.alicontainer.com/poly-arrears-backend-for-frontends';
}else if(process.env.NODE_ENV == 'local'){
	baseUrl = 'http://api-gateway.cba0c8564f4854aee954cc244799b71ab.cn-shenzhen.alicontainer.com/poly-arrears-backend-for-frontends';
}

export {
	baseUrl,
	processUrl
}
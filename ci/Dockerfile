#导入nginx镜像
FROM nginx
MAINTAINER 高伟 <gaowei@shenzhenpoly.com>
#把当前打包工程的html复制到虚拟地址
ADD ./build /usr/share/nginx/html
#使用自定义nginx.conf配置端口和监听
COPY nginx.conf /etc/nginx/nginx.conf
RUN /bin/bash -c 'echo init ok!!!'

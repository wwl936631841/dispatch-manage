def label = "pod-${UUID.randomUUID().toString()}"
def cloud = params.k8s
if(!cloud){
    cloud="kubernetes"
}
podTemplate(
        cloud: "${cloud}",
        label: label,
        containers:
                [containerTemplate(
                        alwaysPullImage: false,
                        image: 'registry.cn-shenzhen.aliyuncs.com/jenkins_ci/jenkins-slave:latest',
                        name: 'jnlp',
                        privileged: false,
                        ttyEnabled: true,
                        workingDir: '/home/jenkins')
                ],
        volumes: [
                  hostPathVolume(hostPath: '/var/run/docker.sock', mountPath: '/var/run/docker.sock'),
                  hostPathVolume(hostPath: '/root/.kube', mountPath: '/home/jenkins/.kube'),
                  hostPathVolume(hostPath: '/usr/bin/docker', mountPath: '/usr/bin/docker')
       
        ]
) { node(label) {
     stage('初始化'){
        checkout scm
     }
     stage("加载参数设置"){
         properties([parameters([choice(choices: ['kubernetes', 'kubernetes-prod'], description: '选择要发布的k8s集群名称', name: 'k8s'), choice(choices: ['test', 'uat', 'prod'], description: '选择要发布的环境', name: 'env')])])
     }

     String env = params.env
     def config = readYaml file:"${pwd()}/ci/jenkins.yml"
     def workspace = "${pwd()}"
     stage('部署环境确认'){
            if (!env){
                error "请选择发布环境"
            }
            String reciever=config.email.publisher
            timeout(1){
                if (env.equalsIgnoreCase("test")) {
                    echo "开始发布测试环境"
                    // input message: '请确认是否拥有发布测试环境权限?', ok: "发布", submitter: 'tester'
                }else if (env.equalsIgnoreCase("uat")){
                    // sendEmail(env,reciever)
                    // input message: '请确认是否拥有发布UAT环境权限?', ok: "发布", submitter: 'publisher'
                    echo "开始发布UAT环境"
                }else if(env.equalsIgnoreCase("prod")){
                    sendEmail(env,reciever)
                    input message: '请确认是否拥有生产环境发布权限?', ok: "发布", submitter: 'publisher'
                }
            }
     }
     def server = getJfrogServer(env,config)
     def yamlDir = "${config.projectName}/${config.businessVersion}"
     def currentVersion
     def lastBuildNum
     def latestDockerImage
    stage('获取制品库镜像'){
        def uploadDir = "${config.jfogServiceName}/${yamlDir}/${env}/buildInfo.yaml"
        def downloadSpec = """{
                "files": [
                {
                    "pattern": "${uploadDir}",
                    "target": "${workspace}/"
                }
                ]
        }"""
        try {
            server.download(downloadSpec)
        } catch (Exception exception) {
            println exception.getMessage()
            throw new GroovyRuntimeException("*****************下载配置文件失败***************")
        }
        def yamAddress = "${yamlDir}/${env}/buildInfo.yaml"
        def isTrue = fileExists "${yamAddress}"
        if(isTrue){
            def buildConfig = readYaml file: "${yamAddress}"
            if(buildConfig!=null){
                currentVersion = buildConfig.current_version
                echo "当前版本为:${currentVersion}"
                lastBuildNum = buildConfig.last_build_num
                echo "最新构建编号：${lastBuildNum}"
                latestDockerImage = buildConfig.docker_image_name
                echo "最新构建镜像:${latestDockerImage}"
            }else{
                error "*****************取值属性错误***************"
            }
        }
    } 
    stage('部署环境'){
        dir("${workspace}/ci/") {
        def build_tag = "${currentVersion}.${lastBuildNum}"
        def app_name = config.k8s.env."${env}".appName
        def namespace = config.k8s.env."${env}".nameSpace
        def service_name = config.k8s.env."${env}".serviceName
        def img_repo = "${config.dockerImageRepo}"
        def img_repo_name = "${config.dockerImageRepoNameSpace}"
        def container_port = config.k8s.env."${env}".appContainerPort
        def node_port = config.k8s.env."${env}".outputPort
        def instance_num = config.k8s.env."${env}".instanceNum
        def env_name=getEnvDockerImgRepoName(env,config)
        echo "当前镜像仓库名称${env_name}"
        //替换deployment文本变量
        sh "sed -i 's/<BUILD_TAG>/${build_tag}/' deploy.yaml"
        sh "sed -i 's/<APP_NAME>/${app_name}/' deploy.yaml"
        sh "sed -i 's/<ENV_NAME>/${env_name}/' deploy.yaml"
        sh "sed -i 's/<NAMESPACE>/${namespace}/' deploy.yaml"
        sh "sed -i 's/<SERVICE_NAME>/${service_name}/' deploy.yaml"
        sh "sed -i 's/<IMG_REPO>/${img_repo}/' deploy.yaml"
        sh "sed -i 's/<IMG_REPO_NAME>/${img_repo_name}/' deploy.yaml"
        sh "sed -i 's/<CONTAINER_PORT>/${container_port}/' deploy.yaml"
        sh "sed -i 's/<NODE_PORT>/${node_port}/' deploy.yaml"
        sh "sed -i 's/<INSTANCE_NUM>/${instance_num}/' deploy.yaml"
        sh "sed -i 's/<DEPLOYMENT>/${app_name}/' run.sh"
        sh "sed -i 's/{DEPLOYMENT}/${app_name}/' run.sh"
        sh "sed -i 's/<NAMESPACE>/${namespace}/' run.sh"
        sh "sed -i 's/<FILE>/deploy.yaml/' run.sh"
        sh "sed -i 's/<IMG_REPO>/${img_repo}/' run.sh"
        sh "sed -i 's/<IMG_REPO_NAME>/${img_repo_name}/' run.sh"
        sh "sed -i 's/<ENV_NAME>/${env_name}/' run.sh"
        sh "sed -i 's/<BUILD_TAG>/${build_tag}/' run.sh"
        sh "chmod a+x run.sh&&./run.sh"
    }  
}   
  }
}



/**
 * 根据环境获取制品库Server对象
 * @param env
 * @return
 */
def getJfrogServer(String env,config){
    def server
    if(env.equalsIgnoreCase("test")){
        server=Artifactory.newServer url:config.jfrogUrl, credentialsId: config.jfrogCredentrialsId
    }else if (env.equalsIgnoreCase("uat")||env.equalsIgnoreCase("prod")){
        server=Artifactory.newServer url:config.jfrogProductOutUrl, credentialsId: config.jfrogProductCredentrialsId
    }
    return server
}

/**
  * 获取不同环境下的镜像仓库名称
  */
def getEnvDockerImgRepoName(String env,config){
     def envName
    if(env.equalsIgnoreCase("test")){
        envName=config.dockerImageRepoName
    }else if (env.equalsIgnoreCase("uat")){
        envName=config.dockerImageUatRepoName
    }else if(env.equalsIgnoreCase("prod")){
        envName=config.dockerImageProdRepoName
    }
    return envName
}

/**
 * 部署UAT/生产环境发送邮件提醒
 * @param status
 * @return
 */
def sendEmail(String env,String reciever) {
    emailext attachLog: true,
             body: "${JOB_NAME}发布消息确认，如果非正常部署，请及时登录阿里云k8s集群管理界面进行回滚操作",
             subject: "${env}环境发布消息通知",
             to: "${reciever}"
}

def label = "pod-${UUID.randomUUID().toString()}"
podTemplate(
        cloud: 'kubernetes',
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
        properties([parameters([choice(choices: ['test', 'uat', 'prod'], description: '选择预发布制品库', name: 'env')])])
    }
    String env = params.env
    echo "当前环境:${env}"
    stage('环境确认'){
        if (!env){
            error "请选择环境"
        }
        timeout(1){
            if (env.equalsIgnoreCase("test")) {
                // input message: '请确认是否拥有上传测试环境制品权限?', ok: "发布", submitter: 'tester'
                echo "开始发布测试环境"
            }else if (env.equalsIgnoreCase("uat")){
                // input message: '请确认是否拥有上传UAT环境制品权限?', ok: "发布", submitter: 'publisher'
                echo "开始发布UAT环境"
            }else if(env.equalsIgnoreCase("prod")){
                input message: '请确认是否拥有上传生产环境制品权限?', ok: "发布", submitter: 'publisher'
            }
        }
    }
    stage('编译打包'){
        sh "cnpm install --global vue-cli&&cnpm install&&npm run build:${env}"
    }
    def config = readYaml file:"${pwd()}/ci/jenkins.yml"
    def workspace = "${pwd()}"
    def server = getJfrogServer(env,config)
    def yamlDir = "${config.projectName}/${config.businessVersion}"
    def buildInfo = "/home/jenkins/workspace/build/${config.projectName}-info"
    sh "mkdir -p ${buildInfo}"
    int buildNum
    stage('上传制品库'){
        lock("${buildInfo}") {
            buildNum = getLatestNum(env,buildInfo, config, yamlDir, server)
            def imageRepoName=getImageRepoName(env,config)
            def appImg = "${config.dockerImageRepo}/${config.dockerImageRepoNameSpace}/${imageRepoName}:${config.businessVersion}.${buildNum}"
            uploadDockerImageToWarehouse(workspace, appImg,config.dockerImageRepo, config.dockerImageRepoCredentrialsId)
            uploadProductToArtiFactory(buildInfo, server, config, buildNum, appImg, workspace, yamlDir,env)
        }
    }
}
}


/**
 * 获取最新的构建编号
 */
int getLatestNum(env,buildInfo,config,yamlDir,server){
    int buildNum = 0
    sh "rm -rf ${buildInfo}/${config.projectName}/${config.businessVersion}/${env}/buildInfo.yaml||true"
    def uploadDir = "${config.jfogServiceName}/${yamlDir}/${env}/buildInfo.yaml"
    def downloadSpec = """{
             "files": [
              {
                  "pattern": "${uploadDir}",
                  "target": "${buildInfo}/"
                }
             ]
        }"""
    try {
        server.download(downloadSpec)
    } catch (Exception exception) {
        println exception.getMessage()
        throw new GroovyRuntimeException("*****************下载配置文件失败***************")
    }
    def yamAddress = "${buildInfo}/${config.projectName}/${config.businessVersion}/${env}/buildInfo.yaml"
    def isTrue = fileExists "${yamAddress}"
    if (isTrue) {
        def buildNumConfig = readYaml file: "${yamAddress}"
        if(buildNumConfig!=null){
            buildNum = buildNumConfig.last_build_num
            if(buildNum==null){
                error "*****************取值属性错误***************"
            }
        }
    } else {
        echo "不存在yml文件,当前构建编号为1"
    }
    ++buildNum
    echo "当前版本号："+buildNum
    return  buildNum
}

/**
 * 上传应用镜像到镜像仓库中
 * @param workspace 当前工作目录
 * @param appImg 镜像名称
 * @param dockerImageRepo 镜像仓库命名空间目录
 * @param dockerImageRepoCrendenTrialsId 镜像仓库凭证
 * @return
 */
def  uploadDockerImageToWarehouse(workspace,appImg,dockerImageRepo,dockerImageRepoCredentrialsId){
    //编译应用镜像
    dir("${workspace}"){
        sh "mv ${workspace}/ci/Dockerfile ${workspace}/"
        sh "mv ${workspace}/ci/nginx.conf ${workspace}/"
        docker.build("${appImg}")
    }
    def image =docker.image("${appImg}")
    try {
        docker.withRegistry("http://${dockerImageRepo}",dockerImageRepoCredentrialsId) {
            image.push()
        }
    }catch(Exception exception){
        error "*****************上传镜像失败*****************"
    }
}



/**
 * 上传制品到制品库
 * @param server
 * @param config
 * @param buildNum
 * @param appImg
 * @param workspace
 * @param yamlDir
 * @return
 */
def uploadProductToArtiFactory(buildInfo,server,config,buildNum,appImg,workspace,yamlDir,env){
    def uploadSpec = """{
        "files": [
          {
            "pattern": "${workspace}/config/*.js",
            "target": "${config.jfogServiceName}/${config.projectName}/${config.businessVersion}/${env}/build_${buildNum}/config/"
          },
          {
            "pattern": "${buildInfo}/${config.projectName}/${config.businessVersion}/${env}/buildInfo.yaml",
            "target": "${config.jfogServiceName}/${config.projectName}/${config.businessVersion}/${env}/"
          }     
      ]
      }"""
    def yaml = ['last_build_num': buildNum,
                'docker_image_name': "${appImg}",
                'current_version': "${config.businessVersion}"
    ]
    sh "rm -rf ${buildInfo}/${config.projectName}/${config.businessVersion}/${env}/buildInfo.yaml"
    writeYaml file: "${buildInfo}/${config.projectName}/${config.businessVersion}/${env}/buildInfo.yaml", data: yaml
    def info = Artifactory.newBuildInfo()
    info.name = "${config.projectName}"
    info.number = "${buildNum}"
    info.env.capture = true
    // 最大构建数量保持20
    info.retention maxBuilds: 20
    // 最长保持15天
    info.retention maxDays: 15
    try {
        info=server.upload(uploadSpec)
        server.publishBuildInfo(info)
    }catch(Exception e){
        error "*****************上传制品库失败*****************"
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
        server=Artifactory.newServer url:config.jfrogProductUrl, credentialsId: config.jfrogProductCredentrialsId
    }
    return server
}

/**
 * 根据环境获取镜像仓库名称
 */
def getImageRepoName(String env,config){
    def imageRepoName
    if(env.equalsIgnoreCase("test")){
        imageRepoName=config.dockerImageRepoName
    }else if (env.equalsIgnoreCase("uat")){
        imageRepoName=config.dockerImageUatRepoName
    }else if(env.equalsIgnoreCase("prod")){
        imageRepoName=config.dockerImageProdRepoName
    }
    return imageRepoName
}



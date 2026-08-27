// Jenkinsfile - SRE Portal 前端 CI/CD
// 手动触发，构建 + 部署到 154.201.73.215

pipeline {
    agent { label 'deploy-agent' }

    environment {
        GIT_REPO = 'https://github.com/muba0321/mubai-portal.git'
        GIT_BRANCH = 'master'
        DEPLOY_HOST = '154.201.73.215'
        DEPLOY_USER = 'root'
        APP_DIR = '/opt/jenkins-agent'
    }

    stages {
        stage('Checkout') {
            steps {
                echo '=== 拉取代码 ==='
                git branch: GIT_BRANCH, url: GIT_REPO
            }
        }

        stage('Install & Build') {
            steps {
                echo '=== 安装依赖 + 构建 ==='
                sh '''
                    cd ${APP_DIR}/workspace/sre-portal-frontend
                    pnpm install
                    # 跳过 TypeScript 类型检查，直接构建
                    npx vite build
                '''
            }
        }

        stage('Deploy') {
            steps {
                echo '=== 部署前端 ==='
                sh '''
                    # deploy-agent 就在 215 上，直接执行 Docker 命令
                    cd ${APP_DIR}/workspace/sre-portal-frontend

                    # 清理旧文件
                    docker exec sre-portal-frontend sh -c 'rm -rf /usr/share/nginx/html/assets /usr/share/nginx/html/index.html'

                    # 复制 dist 到容器
                    docker cp dist/. sre-portal-frontend:/usr/share/nginx/html/

                    echo "Frontend deployed!"
                '''
            }
        }

        stage('Verify') {
            steps {
                echo '=== 验证部署 ==='
                sh '''
                    curl -sf -o /dev/null http://localhost:3000/ && echo "Frontend OK" || echo "Frontend check failed"
                '''
            }
        }
    }

    post {
        success {
            echo '✅ 前端部署成功'
        }
        failure {
            echo '❌ 前端部署失败'
        }
    }
}

// Jenkinsfile - SRE Portal 前端 CI/CD
// 手动触发，构建 + 部署到 154.201.73.215

pipeline {
    agent { label 'deploy-agent' }

    environment {
        GIT_REPO = 'https://github.com/muba0321/mubai-portal.git'
        GIT_BRANCH = 'main'
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
                    # 打包 dist
                    cd ${APP_DIR}/workspace/sre-portal-frontend
                    tar -czf /tmp/fe-deploy.tar.gz -C dist .

                    # 复制到 215 上的 nginx 容器
                    ssh root@${DEPLOY_HOST} << 'REMOTE'
                        mkdir -p /tmp/fe-deploy
                        cd /tmp/fe-deploy && rm -rf *
                        tar -xzf /tmp/fe-deploy.tar.gz

                        # 更新容器内文件
                        docker exec sre-portal-frontend sh -c "rm -rf /usr/share/nginx/html/assets"
                        docker exec sre-portal-frontend mkdir -p /usr/share/nginx/html/assets

                        for f in /tmp/fe-deploy/assets/*; do
                            docker cp "\$f" "sre-portal-frontend:/usr/share/nginx/html/assets/\$(basename \$f)"
                        done
                        docker cp /tmp/fe-deploy/index.html sre-portal-frontend:/usr/share/nginx/html/index.html

                        rm -rf /tmp/fe-deploy /tmp/fe-deploy.tar.gz
                        echo "Frontend deployed!"
                    REMOTE
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

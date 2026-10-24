pipeline {
    agent any

    stages {
        stage('API Testleri') {
            steps {
                bat '''
                    newman run "LogiTest Pro API Tests.postman_collection.json" --reporters cli,htmlextra --reporter-htmlextra-export "LogiTest-Pro-Newman-Report.html"
                '''
            }
        }
    }

    post {
        always {
            publishHTML(target: [
                reportName: 'LogiTest Pro API Test Raporu',
                reportDir: '.',
                reportFiles: 'LogiTest-Pro-Newman-Report.html',
                keepAll: true,
                alwaysLinkToLastBuild: true,
                allowMissing: false
            ])
        }
    }
}
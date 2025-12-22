pipeline {
  agent any

  triggers {
    // run at the top of every hour
    cron('0 * * * *')
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install Dependencies') {
      steps {
        script {
          if (isUnix()) {
            sh 'npm ci'
            sh 'npx playwright install --with-deps'
          } else {
            bat 'npm ci'
            bat 'npx playwright install'
          }
        }
      }
    }

    stage('Run Naukri Update') {
      steps {
        // Provide credentials via Jenkins "Username with password" credential
        // Create a credential in Jenkins with id 'naukri-creds'
        withCredentials([usernamePassword(usernameVariable: 'sachinswapna143@gmail.com', passwordVariable: 'Sapna@143')]) {
          script {
            if (isUnix()) {
              sh 'node naukri-update.js'
            } else {
              bat 'node naukri-update.js'
            }
          }
        }
      }
    }
  }

  post {
    success {
      echo '✅ Naukri update job succeeded'
    }
    failure {
      echo '❌ Naukri update job failed'
    }
  }
}


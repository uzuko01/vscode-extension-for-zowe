/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/

node('ibm-jenkins-slave-nvm') {
  def lib = library("jenkins-library").org.zowe.jenkins_shared_library

  def pipeline = lib.pipelines.nodejs.NodeJSPipeline.new(this)

  pipeline.admins.add("jackjia")

  pipeline.setup(
    packageName: 'org.zowe.vscode-extension'
  )

  // build stage is required
  pipeline.build(
    timeout: [ time: 10, unit: 'MINUTES' ],
    operation: {
      // Create a dummy TestProfileData in order to build the source code. See issue #556
      sh "cp resources/testProfileData.example.ts resources/testProfileData.ts"
      sh "npm run build"
    }
  )

  // Perform Unit Tests and capture the results
  pipeline.test(
      name: "Unit",
      operation: {
        sh "npm run test:unit"
      },
      timeout: [ time: 10, unit: 'MINUTES' ],
      environment: [
        JEST_JUNIT_OUTPUT: "results/unit/junit.xml",
        JEST_SUIT_NAME: "Unit Tests",
        JEST_JUNIT_ANCESTOR_SEPARATOR: " > ",
        JEST_JUNIT_CLASSNAME: "Unit.{classname}",
        JEST_JUNIT_TITLE: "{title}",
        JEST_STARE_RESULT_DIR: "results/unit/jest-stare",
        JEST_STARE_RESULT_HTML: "index.html"
      ],
      junit         : "results/unit/junit.xml",
      cobertura     : [
        coberturaReportFile       : "results/unit/coverage/cobertura-coverage.xml"
      ],
      htmlReports   : [
        [dir: "results/unit/jest-stare", files: "index.html", name: "Zowe Explorer - Unit Test Report"],
        [dir: "results/unit/coverage/lcov-report", files: "index.html", name: "Zowe Explorer - Unit Test Coverage Report"],
      ]
  )

  // we need sonar scan
  pipeline.sonarScan(
    scannerTool     : lib.Constants.DEFAULT_LFJ_SONARCLOUD_SCANNER_TOOL,
    scannerServer   : lib.Constants.DEFAULT_LFJ_SONARCLOUD_SERVER,
    allowBranchScan : lib.Constants.DEFAULT_LFJ_SONARCLOUD_ALLOW_BRANCH,
    failBuild       : lib.Constants.DEFAULT_LFJ_SONARCLOUD_FAIL_BUILD
  )

  // define we need publish stage
  // pipeline.publish()

  // define we need release stage
  // pipeline.release()

  // Once called, no stages can be added and all added stages will be executed.
  // On completion appropriate emails will be sent out by the shared library.
  pipeline.end()
}

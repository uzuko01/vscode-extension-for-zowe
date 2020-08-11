/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

const fs = require('fs');
const path = require('path');

const package = process.argv[2];
const packageName = process.argv[3];
const extension = process.argv[4];

const from = path.join('packages', package, 'dist', `${packageName}.${extension}`);
const to = path.join('dist', `${packageName}-${process.env.npm_package_version}.${extension}`);

fs.copyFileSync(from, to);
console.log(`Published package to ${to}.`);

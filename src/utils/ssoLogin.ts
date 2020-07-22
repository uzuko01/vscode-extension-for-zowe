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

import * as vscode from "vscode";
import { IProfile, IUpdateProfile, Session, SessConstants } from "@zowe/imperative";
import * as zowe from "@zowe/cli";
import { Profiles } from "../Profiles";
import * as nls from "vscode-nls";

// Set up localization
nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone })();
const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export async function ssoLoginDialog() {
    let chosenBase;
    const possibles = Profiles.getInstance().getAllTypes().filter( (value) => value === "base");
    if (!possibles.length) {
        vscode.window.showInformationMessage(localize("ssoLogin.noProfilesLoaded", "No base profiles available"));
        return;
    }
    const baseProfiles = Profiles.getInstance().getNamesForType("base");
    const quickPickOptions: vscode.QuickPickOptions = {
        placeHolder: localize("ssoLogin.selectBaseProfile", "Select a base profile to log in with"),
        ignoreFocusOut: true,
        canPickMany: false
    };
    chosenBase = await vscode.window.showQuickPick(baseProfiles, quickPickOptions);
    if (chosenBase) {
        try {
            const profileManager = await Profiles.getInstance().getCliProfileManager("base");
            const zosmfDefault = await Profiles.getInstance().getDefaultProfile("zosmf");
            const origBaseProfile = (await profileManager.loadAll()).find((profile) => profile.name === chosenBase);

            // TODO prompt for parameters using getSession or getValidSession
            const updSession = new Session({
                hostname: origBaseProfile.profile.host,
                port: origBaseProfile.profile.port,
                user: zosmfDefault.profile.user,
                password: zosmfDefault.profile.password,
                rejectUnauthorized: origBaseProfile.profile.rejectUnauthorized,
                tokenType: SessConstants.TOKEN_TYPE_APIML,
                type: SessConstants.AUTH_TYPE_TOKEN
            });

            const loginToken = await zowe.Login.apimlLogin(updSession);

            const updBaseProfile: IProfile = {
                host: origBaseProfile.profile.host,
                port: origBaseProfile.profile.port,
                rejectUnauthorized: origBaseProfile.profile.rejectUnauthorized,
                tokenType: SessConstants.TOKEN_TYPE_APIML,
                tokenValue: loginToken
            };

            const updateParms: IUpdateProfile = {
                name: chosenBase,
                merge: true,
                profile: updBaseProfile
            };

            try {
                await profileManager.update(updateParms);
                await Profiles.getInstance().refresh();
            } catch (error) {
                vscode.window.showErrorMessage(error.message);
                return;
            }
            vscode.window.showInformationMessage(localize("ssoLogin.successful", "Log in with {0} was successful", chosenBase));
        } catch (err) {
            vscode.window.showErrorMessage(localize("ssoLogin.unableToLogin", "Unable to login. ") + err.message);
        }
    }
}

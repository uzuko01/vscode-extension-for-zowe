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

import * as path from "path";
import * as os from "os";
import { IProfileLoaded, Logger, IProfAttrs, IProfile, ProfileInfo, ConfigSchema, ConfigBuilder, ImperativeConfig, Config } from "@zowe/imperative";

export interface IProfileValidationConfig {
    status: string;
    name: string;
}

export interface IValidationSettingConfig {
    name: string;
    setting: boolean;
}
export class ProfilesConfig {
    public profilesForValidation: IProfileValidationConfig[] = [];
    public profilesValidationSetting: IValidationSettingConfig[] = [];
    public allProfiles: IProfileLoaded[] = [];
    protected allTypes: string[];
    protected profilesByType = new Map<string, IProfileLoaded[]>();
    protected defaultProfileByType = new Map<string, IProfileLoaded>();
    public constructor(protected log: Logger) {}

    public static createInstance(mProfileInfo: ProfileInfo): ProfileInfo {
        return (ProfilesConfig.info = mProfileInfo);
    }

    public static getInstance(): ProfileInfo {
        return ProfilesConfig.info;
    }

    private static info: ProfileInfo;

    public static async getMergedAttrs(mProfileInfo: ProfileInfo, profAttrs: IProfAttrs): Promise<IProfile> {
        const profile: IProfile = {};
        if (profAttrs != null) {
            const mergedArgs = mProfileInfo.mergeArgsForProfile(profAttrs);

            for (const arg of mergedArgs.knownArgs) {
                profile[arg.argName] = arg.secure ? await mProfileInfo.loadSecureArg(arg) : arg.argValue;
            }
        }
        return profile;
    }

    public static getDefaultProfile(mProfileInfo: ProfileInfo, profileType: string): IProfAttrs {
        return mProfileInfo.getDefaultProfile(profileType);
    }

    public static async createSchema(): Promise<string> {
        try {
            ImperativeConfig.instance.loadedConfig = {
                defaultHome: path.join(os.homedir(), ".zowe"),
                envVariablePrefix: "ZOWE",
            };
            // await ProfilesConfig.getInstance().readProfilesFromDisk();
            // const config = ProfilesConfig.getInstance().getTeamConfig();
            const config = await Config.load("zowe");
            config.setSchema(ConfigSchema.buildSchema(ImperativeConfig.instance.loadedConfig.profiles));

            // Note: IConfigBuilderOpts not exported
            // const opts: IConfigBuilderOpts = {
            const opts: any = {
            // getSecureValue: this.promptForProp.bind(this),
                populateProperties: true
            };

            // Build new config and merge with existing layer
            config.api.layers.merge(await ConfigBuilder.build(ImperativeConfig.instance.loadedConfig, opts));
            return "done!";
        } catch (err) {
            return "Error: " + err.message;
        }
    }
}

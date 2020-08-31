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

import {
    createISessionWithoutCredentials, createTreeView, createIProfile, createInstanceOfProfile,
    createQuickPickItem, createQuickPickContent, createInputBox, createBasicZosmfSession,
    createPersistentConfig, createInvalidIProfile, createValidIProfile, createValidBaseProfile, createISession
} from "../../__mocks__/mockCreators/shared";
import { createDatasetSessionNode, createDatasetTree } from "../../__mocks__/mockCreators/datasets";
import { createProfileManager, createTestSchemas } from "../../__mocks__/mockCreators/profiles";
import * as vscode from "vscode";
import * as utils from "../../src/utils";
import * as child_process from "child_process";
import { Logger, IProfileLoaded, Session, CliProfileManager, SessConstants } from "@zowe/imperative";
import * as globals from "../../src/globals";
import { Profiles, ValidProfileEnum } from "../../src/Profiles";
import { ZosmfSession, IJob, CheckStatus } from "@zowe/cli";
import { ZoweUSSNode } from "../../src/uss/ZoweUSSNode";
import { ZoweExplorerApiRegister } from "../../src/api/ZoweExplorerApiRegister";
import { ZoweExplorerApi } from "../../src/api/ZoweExplorerApi";
import { ZoweDatasetNode } from "../../src/dataset/ZoweDatasetNode";
import { Job } from "../../src/job/ZoweJobNode";
import { createUSSSessionNode, createUSSTree } from "../../__mocks__/mockCreators/uss";
import { createJobsTree, createIJobObject, } from "../../__mocks__/mockCreators/jobs";
import { DefaultProfileManager } from "../../src/profiles/DefaultProfileManager";

jest.mock("vscode");
jest.mock("child_process");
jest.mock("fs");
jest.mock("fs-extra");

async function createGlobalMocks() {
    const newMocks = {
        mockShowInputBox: jest.fn(),
        mockGetConfiguration: jest.fn(),
        mockCreateQuickPick: jest.fn(),
        mockShowQuickPick: jest.fn(),
        mockShowInformationMessage: jest.fn(),
        mockGetInstance: jest.fn(),
        mockCollectProfileDetails: jest.fn(),
        mockShowErrorMessage: jest.fn(),
        mockCreateInputBox: jest.fn(),
        mockLog: jest.fn(),
        mockDebug: jest.fn(),
        defaultProfileManagerInstance: null,
        defaultProfile: null,
        testSession: createISession(),
        mockError: jest.fn(),
        commonApi: null,
        mockGetCommonApi: jest.fn(),
        mockGetValidSession: jest.fn(),
        mockConfigurationTarget: jest.fn(),
        mockCreateBasicZosmfSession: jest.fn(),
        mockCliProfileManager: createProfileManager(),
        profiles: null
    };

    // Mocking Default Profile Manager
    newMocks.defaultProfileManagerInstance = await DefaultProfileManager.createInstance(Logger.getAppLogger());
    newMocks.profiles = await Profiles.createInstance(Logger.getAppLogger());
    newMocks.defaultProfile = DefaultProfileManager.getInstance().getDefaultProfile("zosmf");
    Object.defineProperty(DefaultProfileManager, "getInstance", { value: jest.fn(() => newMocks.defaultProfileManagerInstance), configurable: true });
    Object.defineProperty(newMocks.defaultProfileManagerInstance, "getDefaultProfile", { value: jest.fn(() => newMocks.defaultProfile), configurable: true });
    
    // Common API mocks
    newMocks.commonApi = ZoweExplorerApiRegister.getCommonApi(newMocks.defaultProfile);
    newMocks.mockGetCommonApi.mockReturnValue(newMocks.commonApi);
    newMocks.mockGetValidSession.mockReturnValue(newMocks.testSession);
    ZoweExplorerApiRegister.getCommonApi = newMocks.mockGetCommonApi.bind(ZoweExplorerApiRegister);

    Object.defineProperty(vscode.window, "showInformationMessage", { value: newMocks.mockShowInformationMessage, configurable: true });
    Object.defineProperty(vscode.window, "showInputBox", { value: newMocks.mockShowInputBox, configurable: true });
    Object.defineProperty(vscode.window, "showErrorMessage", { value: newMocks.mockShowErrorMessage, configurable: true });
    Object.defineProperty(vscode.window, "showQuickPick", { value: newMocks.mockShowQuickPick, configurable: true });
    Object.defineProperty(vscode.window, "createQuickPick", { value: newMocks.mockCreateQuickPick, configurable: true });
    Object.defineProperty(Profiles, "getInstance", { value: newMocks.mockGetInstance, configurable: true });
    Object.defineProperty(Profiles, "collectProfileDetails", { value: newMocks.mockCollectProfileDetails, configurable: true });
    Object.defineProperty(globals, "LOG", { value: newMocks.mockLog, configurable: true });
    Object.defineProperty(vscode.window, "createInputBox", { value: newMocks.mockCreateInputBox, configurable: true });
    Object.defineProperty(globals.LOG, "debug", { value: newMocks.mockDebug, configurable: true });
    Object.defineProperty(ZosmfSession, "createBasicZosmfSession", { value: newMocks.mockCreateBasicZosmfSession });
    Object.defineProperty(globals.LOG, "error", { value: newMocks.mockError, configurable: true });
    Object.defineProperty(globals, "ISTHEIA", { get: () => false, configurable: true });
    Object.defineProperty(vscode.window, "createTreeView", { value: jest.fn(), configurable: true });
    Object.defineProperty(vscode.workspace, "getConfiguration", { value: newMocks.mockGetConfiguration, configurable: true });
    Object.defineProperty(vscode, "ConfigurationTarget", { value: newMocks.mockConfigurationTarget, configurable: true });

    return newMocks;
}

describe("Profiles Unit Tests - Function createZoweSession", () => {
    async function createBlockMocks(globalMocks) {
        const newMocks = {
            session: createISessionWithoutCredentials(),
            treeView: createTreeView(),
            mockLoadNamedProfile: jest.fn(),
            imperativeProfile: createIProfile(),
            datasetSessionNode: null,
            quickPickItem: createQuickPickItem(),
            qpPlaceholder: "Choose \"Create new...\" to define a new profile or select an existing profile to Add to the Data Set Explorer",
            testDatasetTree: null,
            profileInstance: null,
        };
        Object.defineProperty(globalMocks.commonApi, "getValidSession", { value: globalMocks.mockGetValidSession, configurable: true });
        newMocks.profileInstance = createInstanceOfProfile(globalMocks.profiles, newMocks.session);
        newMocks.datasetSessionNode = createDatasetSessionNode(newMocks.session, newMocks.imperativeProfile);
        newMocks.testDatasetTree = createDatasetTree(newMocks.datasetSessionNode, newMocks.treeView);
        newMocks.mockLoadNamedProfile.mockReturnValue(newMocks.imperativeProfile);
        newMocks.profileInstance.loadNamedProfile = newMocks.mockLoadNamedProfile;
        globalMocks.mockGetInstance.mockReturnValue(newMocks.profileInstance);

        return newMocks;
    }

    it("Tests that createZoweSession fails if profile name is invalid", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);
        const entered = undefined;
        globalMocks.mockShowInputBox.mockResolvedValueOnce(entered);

        // Assert edge condition user cancels the input path box
        globalMocks.mockCreateQuickPick.mockReturnValue(createQuickPickContent(entered, [blockMocks.quickPickItem], blockMocks.qpPlaceholder));
        jest.spyOn(utils, "resolveQuickPickHelper").mockResolvedValueOnce(blockMocks.quickPickItem);

        await Profiles.getInstance().loadNamedProfile("profile1");
        await globalMocks.profiles.createZoweSession(blockMocks.testDatasetTree);
        expect(globalMocks.mockShowInformationMessage.mock.calls[0][0]).toEqual("Profile Name was not supplied. Operation Cancelled");
    });

    it("Tests that createZoweSession successfully creates a new session with profile name supplied by user", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);
        const entered = undefined;
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake");

        // Assert edge condition user cancels the input path box
        globalMocks.mockCreateQuickPick.mockReturnValue(createQuickPickContent(entered, [blockMocks.quickPickItem], blockMocks.qpPlaceholder));
        jest.spyOn(utils, "resolveQuickPickHelper").mockResolvedValueOnce(blockMocks.quickPickItem);

        await globalMocks.profiles.createZoweSession(blockMocks.testDatasetTree);
        expect(blockMocks.testDatasetTree.addSession).toBeCalled();
        expect(blockMocks.testDatasetTree.addSession.mock.calls[0][0]).toEqual({ newprofile: "fake" });
    });

    it("Tests that createZoweSession successfully creates a new session with profile name selected from list by user", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);
        const entered = "";

        // Assert edge condition user cancels the input path box
        const quickPickContent = createQuickPickContent(entered, [blockMocks.quickPickItem], blockMocks.qpPlaceholder);
        quickPickContent.label = "firstName";
        globalMocks.mockCreateQuickPick.mockReturnValue(quickPickContent);
        jest.spyOn(utils, "resolveQuickPickHelper").mockResolvedValueOnce(quickPickContent);

        await globalMocks.profiles.createZoweSession(blockMocks.testDatasetTree);
        expect(blockMocks.testDatasetTree.addSession).toBeCalled();
        expect(blockMocks.testDatasetTree.addSession.mock.calls[0][0]).toBe("firstName");

    });

    it("Tests that createZoweSession successfully creates a new session with profile name selected from list by user by typing", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);
        const entered = "fake";

        globalMocks.mockCreateQuickPick.mockReturnValue(createQuickPickContent(entered, [blockMocks.quickPickItem], blockMocks.qpPlaceholder));
        jest.spyOn(utils, "resolveQuickPickHelper").mockResolvedValueOnce(blockMocks.quickPickItem);

        await globalMocks.profiles.createZoweSession(blockMocks.testDatasetTree);
        expect(blockMocks.testDatasetTree.addSession).not.toBeCalled();
    });

    it("Tests that createZoweSession fails if profile not selected", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);
        const entered = "";

        // Assert edge condition user cancels the input path box
        const quickPickContent = createQuickPickContent(entered, [blockMocks.quickPickItem], blockMocks.qpPlaceholder);
        quickPickContent.label = undefined;
        globalMocks.mockCreateQuickPick.mockReturnValue(quickPickContent);
        jest.spyOn(utils, "resolveQuickPickHelper").mockResolvedValueOnce(quickPickContent);

        await globalMocks.profiles.createZoweSession(blockMocks.testDatasetTree);
        expect(blockMocks.testDatasetTree.addSession).not.toBeCalled();
    });

    it("Tests that createZoweSession fails if createNewConnection fails", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);
        const entered = "fake";
        blockMocks.profileInstance.createNewConnection = jest.fn().mockRejectedValue(new Error("create connection error"));
        globalMocks.mockShowInputBox.mockResolvedValueOnce(entered);

        globalMocks.mockCreateQuickPick.mockReturnValue(createQuickPickContent(entered, [blockMocks.quickPickItem], blockMocks.qpPlaceholder));
        jest.spyOn(utils, "resolveQuickPickHelper").mockResolvedValueOnce(blockMocks.quickPickItem);
        const errorHandlingSpy = jest.spyOn(utils, "errorHandling");

        await globalMocks.profiles.createZoweSession(blockMocks.testDatasetTree);
        expect(errorHandlingSpy).toBeCalled();
        expect(errorHandlingSpy.mock.calls[0][0]).toEqual(new Error("create connection error"));
    });

    it("Testing that createZoweSession with theia", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        const entered = "";
        const createZoweSessionSpy = jest.spyOn(globalMocks.profiles, "createZoweSession");
        Object.defineProperty(globals, "ISTHEIA", { get: () => true, configurable: true });
        globalMocks.mockCreateQuickPick.mockReturnValue(createQuickPickContent(entered, [blockMocks.quickPickItem], blockMocks.qpPlaceholder));
        jest.spyOn(utils, "resolveQuickPickHelper").mockResolvedValueOnce(blockMocks.quickPickItem);

        await globalMocks.profiles.createZoweSession(blockMocks.testDatasetTree);
        expect(createZoweSessionSpy).toHaveBeenCalled();
    });

    it("Testing that createZoweSession with theia fails if no choice", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        const entered = null;
        const createZoweSessionSpy = jest.spyOn(globalMocks.profiles, "createZoweSession");
        Object.defineProperty(globals, "ISTHEIA", { get: () => true, configurable: true });
        globalMocks.mockCreateQuickPick.mockReturnValue(createQuickPickContent(entered, [blockMocks.quickPickItem], blockMocks.qpPlaceholder));
        jest.spyOn(utils, "resolveQuickPickHelper").mockResolvedValueOnce(blockMocks.quickPickItem);

        await globalMocks.profiles.createZoweSession(blockMocks.testDatasetTree);
        expect(createZoweSessionSpy).toHaveBeenCalled();
        expect(globalMocks.mockShowInformationMessage.mock.calls.length).toBe(1);
    });
});

describe("Profiles Unit Tests - Function createNewConnection", () => {
    async function createBlockMocks(globalMocks) {
        const newMocks = {
            session: createISessionWithoutCredentials(),
            treeView: createTreeView(),
            mockLoadNamedProfile: jest.fn(),
            imperativeProfile: createIProfile(),
            datasetSessionNode: null,
            inputBox: createInputBox("input"),
            quickPickItem: createQuickPickItem(),
            testSchemas: createTestSchemas(),
            testDatasetTree: null,
            profileInstance: null
        };
        Object.defineProperty(globalMocks.commonApi, "getValidSession", { value: globalMocks.mockGetValidSession, configurable: true });
        newMocks.imperativeProfile.name = "profile1";
        newMocks.imperativeProfile.profile.user = "fake";
        newMocks.imperativeProfile.profile.password = "1234";
        newMocks.profileInstance = createInstanceOfProfile(globalMocks.profiles, newMocks.session);
        newMocks.mockLoadNamedProfile.mockReturnValue(newMocks.imperativeProfile);
        newMocks.profileInstance.loadNamedProfile = newMocks.mockLoadNamedProfile;
        newMocks.profileInstance.getSchema.mockReturnValue(newMocks.testSchemas[0]);
        globalMocks.mockGetInstance.mockReturnValue(newMocks.profileInstance);
        globalMocks.mockCreateInputBox.mockReturnValue(newMocks.inputBox);
        newMocks.datasetSessionNode = createDatasetSessionNode(newMocks.session, newMocks.imperativeProfile);
        newMocks.testDatasetTree = createDatasetTree(newMocks.datasetSessionNode, newMocks.treeView);

        return newMocks;
    }

    it("Tests that createNewConnection fails if profileName is missing", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        await globalMocks.profiles.createNewConnection("");
        expect(globalMocks.mockShowInformationMessage.mock.calls.length).toBe(1);
        expect(globalMocks.mockShowInformationMessage.mock.calls[0][0]).toBe("Profile name was not supplied. Operation Cancelled");
    });

    it("Tests that createNewConnection fails if profileType is missing", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        blockMocks.profileInstance.getProfileType = jest.fn(() => new Promise((resolve) => { resolve(undefined); }));

        await globalMocks.profiles.createNewConnection(blockMocks.imperativeProfile.name);
        expect(globalMocks.mockShowErrorMessage.mock.calls.length).toBe(1);
        expect(globalMocks.mockShowErrorMessage.mock.calls[0][0]).toBe("Error: No profile type was chosen. Operation Cancelled");
    });

    it("Tests that createNewConnection fails if zOSMF URL is missing", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        blockMocks.profileInstance.getSchema.mockResolvedValueOnce(blockMocks.testSchemas[0]);
        globalMocks.mockShowInputBox.mockResolvedValueOnce(undefined);

        await globalMocks.profiles.createNewConnection(blockMocks.imperativeProfile.name);
        expect(globalMocks.mockShowErrorMessage.mock.calls.length).toBe(1);
        expect(globalMocks.mockShowErrorMessage.mock.calls[0][0]).toBe("Error: No valid value for z/OS URL. Operation Cancelled");
    });

    it("Tests that createNewConnection fails if rejectUnauthorized is missing", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        blockMocks.profileInstance.getSchema.mockResolvedValueOnce(blockMocks.testSchemas[0]);
        globalMocks.mockShowInputBox.mockResolvedValueOnce("https://fake:143");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("143");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake");
        globalMocks.mockShowInputBox.mockResolvedValueOnce(undefined);

        await globalMocks.profiles.createNewConnection(blockMocks.imperativeProfile.name);
        expect(globalMocks.mockShowErrorMessage.mock.calls[0][0]).toBe("Error: No certificate option selected. Operation Cancelled");
    });

    it("Tests that createNewConnection fails if profileName is a duplicate", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        blockMocks.profileInstance.getSchema.mockResolvedValueOnce(blockMocks.testSchemas[0]);
        globalMocks.mockShowInputBox.mockResolvedValueOnce("https://fake:143");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("143");
        globalMocks.mockShowInputBox.mockResolvedValue("fake");
        globalMocks.mockShowQuickPick.mockResolvedValueOnce("False - Accept connections with self-signed certificates");

        await globalMocks.profiles.createNewConnection(blockMocks.imperativeProfile.name);
        expect(globalMocks.mockShowErrorMessage.mock.calls.length).toBe(1);
        expect(globalMocks.mockShowErrorMessage.mock.calls[0][0]).toBe("Profile name already exists. Please create a profile using a different name");
    });

    it("Tests that createNewConnection creates a new profile", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        blockMocks.profileInstance.getSchema.mockResolvedValueOnce(blockMocks.testSchemas[0]);
        globalMocks.mockShowInputBox.mockResolvedValueOnce("https://fake:143");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("143");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake");
        globalMocks.mockShowQuickPick.mockResolvedValueOnce("False - Accept connections with self-signed certificates");

        await globalMocks.profiles.createNewConnection("fake");
        expect(globalMocks.mockShowInformationMessage.mock.calls[0][0]).toBe("Profile fake was created.");
    });

    it("Tests that createNewConnection creates a new profile with optional credentials", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        blockMocks.profileInstance.getSchema.mockResolvedValueOnce(blockMocks.testSchemas[1]);
        globalMocks.mockShowInputBox.mockResolvedValueOnce("https://fake:143");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("");
        globalMocks.mockShowQuickPick.mockResolvedValueOnce("True");
        globalMocks.mockShowQuickPick.mockResolvedValueOnce("False - Accept connections with self-signed certificates");

        await globalMocks.profiles.createNewConnection("fake");
        // tslint:disable-next-line: no-magic-numbers
        expect(globalMocks.mockShowInformationMessage.mock.calls.length).toBe(3);
        expect(globalMocks.mockShowInformationMessage.mock.calls[2][0]).toBe("Profile fake was created.");
    });

    it("Tests that createNewConnection creates a new profile twice in a row", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        blockMocks.profileInstance.getSchema.mockResolvedValueOnce(blockMocks.testSchemas[0]);
        globalMocks.mockShowInputBox.mockResolvedValueOnce("https://fake:143");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("143");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake1");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake1");
        globalMocks.mockShowQuickPick.mockResolvedValueOnce("False - Accept connections with self-signed certificates");

        await globalMocks.profiles.createNewConnection("fake1");
        expect(globalMocks.mockShowInformationMessage.mock.calls.length).toBe(1);
        expect(globalMocks.mockShowInformationMessage.mock.calls[0][0]).toBe("Profile fake1 was created.");

        globalMocks.mockShowInputBox.mockReset();
        globalMocks.mockShowInformationMessage.mockReset();
        globalMocks.mockShowInputBox.mockResolvedValueOnce("https://fake:143");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("143");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake2");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake2");
        globalMocks.mockShowQuickPick.mockResolvedValueOnce("True - Reject connections with self-signed certificates");

        await globalMocks.profiles.createNewConnection("fake2");
        expect(globalMocks.mockShowInformationMessage.mock.calls.length).toBe(1);
        expect(globalMocks.mockShowInformationMessage.mock.calls[0][0]).toBe("Profile fake2 was created.");
    });

    it("Tests that createNewConnection creates an alternate profile", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        blockMocks.profileInstance.getProfileType = jest.fn(() => new Promise((resolve) => { resolve("alternate"); }));
        blockMocks.profileInstance.getSchema.mockResolvedValueOnce(blockMocks.testSchemas[1]);
        globalMocks.mockShowInputBox.mockResolvedValueOnce("https://fake:234");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("234");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake");
        globalMocks.mockShowQuickPick.mockResolvedValueOnce("False");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("13");

        await globalMocks.profiles.createNewConnection("alternate");
        expect(globalMocks.mockShowInformationMessage.mock.calls.length).toBe(1);
        expect(globalMocks.mockShowInformationMessage.mock.calls[0][0]).toBe("Profile alternate was created.");
    });

    it("Tests that createNewConnection creates an alternate profile with default aNumber value", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        blockMocks.profileInstance.getProfileType = jest.fn(() => new Promise((resolve) => { resolve("alternate"); }));
        blockMocks.profileInstance.getSchema.mockResolvedValueOnce(blockMocks.testSchemas[1]);
        globalMocks.mockShowInputBox.mockResolvedValueOnce("https://fake:234");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("234");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake");
        globalMocks.mockShowQuickPick.mockResolvedValueOnce("False");
        globalMocks.mockShowInputBox.mockResolvedValueOnce(undefined);

        await globalMocks.profiles.createNewConnection("alternate");
        expect(globalMocks.mockShowInformationMessage.mock.calls.length).toBe(1);
        expect(globalMocks.mockShowInformationMessage.mock.calls[0][0]).toBe("Profile alternate was created.");
    });

    it("Tests that createNewConnection creates an alternate profile with default port value", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        blockMocks.profileInstance.getProfileType = jest.fn(() => new Promise((resolve) => { resolve("alternate"); }));
        blockMocks.profileInstance.getSchema.mockResolvedValueOnce(blockMocks.testSchemas[1]);
        globalMocks.mockShowInputBox.mockResolvedValueOnce("https://fake");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("0");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake");
        globalMocks.mockShowQuickPick.mockResolvedValueOnce("True");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("126");

        await globalMocks.profiles.createNewConnection("alternate");
        expect(globalMocks.mockShowInformationMessage.mock.calls.length).toBe(1);
        expect(globalMocks.mockShowInformationMessage.mock.calls[0][0]).toBe("Profile alternate was created.");
    });

    it("Tests that createNewConnection fails to create an alternate profile if port is invalid", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        blockMocks.profileInstance.getProfileType = jest.fn(() => new Promise((resolve) => { resolve("alternate"); }));
        blockMocks.profileInstance.getSchema.mockResolvedValueOnce(blockMocks.testSchemas[1]);
        globalMocks.mockShowInputBox.mockResolvedValueOnce("https://fake");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake");

        await globalMocks.profiles.createNewConnection("fake");
        expect(globalMocks.mockShowErrorMessage.mock.calls.length).toBe(1);
        expect(globalMocks.mockShowErrorMessage.mock.calls[0][0]).toBe("Error: Invalid Port number provided or operation was cancelled");
    });

    it("Tests that createNewConnection fails to create an alternate profile if aBoolean is invalid", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        blockMocks.profileInstance.getProfileType = jest.fn(() => new Promise((resolve) => { resolve("alternate"); }));
        blockMocks.profileInstance.getSchema.mockResolvedValueOnce(blockMocks.testSchemas[1]);
        globalMocks.mockShowInputBox.mockResolvedValueOnce("https://fake:143");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("143");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake");
        globalMocks.mockShowQuickPick.mockResolvedValueOnce(undefined);

        await globalMocks.profiles.createNewConnection("fake");
        expect(globalMocks.mockShowErrorMessage.mock.calls.length).toBe(1);
        expect(globalMocks.mockShowErrorMessage.mock.calls[0][0]).toBe("Error: No boolean selected. Operation Cancelled");
    });

    it("Tests that createNewConnection creates an alternate profile with an optional port", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        blockMocks.profileInstance.getProfileType = jest.fn(() => new Promise((resolve) => { resolve("alternate"); }));
        blockMocks.profileInstance.getSchema.mockResolvedValueOnce(blockMocks.testSchemas[2]);
        globalMocks.mockShowInputBox.mockResolvedValueOnce("https://fake");
        globalMocks.mockShowInputBox.mockResolvedValueOnce(Number("143"));

        await globalMocks.profiles.createNewConnection("fake");
        expect(globalMocks.mockShowInformationMessage.mock.calls.length).toBe(1);
        expect(globalMocks.mockShowInformationMessage.mock.calls[0][0]).toBe("Profile fake was created.");
    });
});

describe("Profiles Unit Tests - Function getProfileType", () => {
    function createBlockMocks(globalMocks) {
        const newMocks = {
            mockRegisteredApiTypes: jest.fn(() => ["zosmf"]),
            originalRegisteredApiTypes: null
        };
        Object.defineProperty(globalMocks.commonApi, "getValidSession", { value: globalMocks.mockGetValidSession, configurable: true });
        newMocks.originalRegisteredApiTypes = ZoweExplorerApiRegister.getInstance().registeredApiTypes;
        ZoweExplorerApiRegister.getInstance().registeredApiTypes = newMocks.mockRegisteredApiTypes;

        return newMocks;
    }

    it("Tests that getProfileType returns correct profile type when receiving only one type", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        const response = await globalMocks.profiles.getProfileType();
        expect(response).toEqual("zosmf");

        ZoweExplorerApiRegister.getInstance().registeredApiTypes = blockMocks.originalRegisteredApiTypes;
    });

    it("Tests that getProfileType returns correct profile type when receiving multiple types", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        blockMocks.mockRegisteredApiTypes.mockReturnValue(["zosmf", "alternate"]);
        globalMocks.mockShowQuickPick.mockResolvedValueOnce("alternate");

        const res = await globalMocks.profiles.getProfileType();
        expect(res).toEqual("alternate");

        ZoweExplorerApiRegister.getInstance().registeredApiTypes = blockMocks.originalRegisteredApiTypes;
    });
});

describe("Profiles Unit Tests - Function getSchema", () => {
    async function createBlockMocks(globalMocks) {
        const newMocks = { testSchemas: createTestSchemas() };
        Object.defineProperty(globalMocks.commonApi, "getValidSession", { value: globalMocks.mockGetValidSession, configurable: true });

        return newMocks;
    }

    it("Tests that getSchema returns correct schema for zosmf profile", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);
        Object.defineProperty(globalMocks.profiles, "getCliProfileManager",
            { value: jest.fn(() => Promise.resolve(globalMocks.mockCliProfileManager)) });

        const response = await globalMocks.profiles.getSchema("zosmf");
        // tslint:disable-next-line: no-magic-numbers
        expect(response).toEqual(blockMocks.testSchemas[3]);
    });
});

describe("Profiles Unit Tests - Property allProfiles", () => {
    it("Tests that allProfiles contains all profiles", async () => {
        const globalMocks = await createGlobalMocks();
        Object.defineProperty(globalMocks.commonApi, "getValidSession", { value: globalMocks.mockGetValidSession, configurable: true });

        const loadedProfiles = globalMocks.profiles.allProfiles;
        expect(loadedProfiles).toEqual([{ name: "sestest", profile: {}, type: "zosmf" },
        { name: "profile1", profile: {}, type: "zosmf" },
        { name: "profile2", profile: {}, type: "zosmf" }]);
    });
});

describe("Profiles Unit Tests - Function updateProfile", () => {
    async function createBlockMocks(globalMocks) {
        const newMocks = {
            imperativeProfile: createIProfile(),
            changedImperativeProfile: createIProfile(),
            profileInfo: null,
            session: createISessionWithoutCredentials(),
            log: Logger.getAppLogger(),
            profiles: null,
            profileInstance: null
        };
        Object.defineProperty(globalMocks.commonApi, "getValidSession", { value: globalMocks.mockGetValidSession, configurable: true });
        newMocks.profiles = await Profiles.createInstance(newMocks.log);
        newMocks.profileInstance = createInstanceOfProfile(newMocks.profiles, newMocks.session);
        newMocks.changedImperativeProfile.profile = { user: "test2", password: "test2" };
        newMocks.profileInfo = newMocks.changedImperativeProfile;
        Object.defineProperty(globalMocks.mockCliProfileManager, "load", {
            value: jest.fn(() => {
                return new Promise((resolve) => { resolve(newMocks.imperativeProfile); });
            }),
            configurable: true
        });
        Object.defineProperty(globalMocks.mockCliProfileManager, "update", { value: jest.fn(), configurable: true });
        newMocks.profiles.getCliProfileManager = () => Promise.resolve(globalMocks.mockCliProfileManager);

        return newMocks;
    }

    it("Tests that updateProfile successfully updates a profile of undefined type", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);
        blockMocks.profileInfo.type = undefined;

        await blockMocks.profiles.updateProfile(blockMocks.profileInfo);
        expect(blockMocks.imperativeProfile.profile).toEqual(blockMocks.changedImperativeProfile.profile);
    });

    it("Tests that updateProfile successfully updates a profile of defined type (zosmf)", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        await blockMocks.profiles.updateProfile(blockMocks.profileInfo);
        expect(blockMocks.imperativeProfile.profile).toEqual(blockMocks.changedImperativeProfile.profile);
    });
});

describe("Profiles Unit Tests - Function editSession", () => {
    async function createBlockMocks(globalMocks) {
        const newMocks = {
            log: Logger.getAppLogger(),
            session: createISessionWithoutCredentials(),
            mockLoadNamedProfile: jest.fn(),
            imperativeProfile: createIProfile(),
            datasetSessionNode: null,
            inputBox: createInputBox("input"),
            testSchemas: createTestSchemas(),
            profileInstance: null
        };
        Object.defineProperty(globalMocks.commonApi, "getValidSession", { value: globalMocks.mockGetValidSession, configurable: true });
        newMocks.imperativeProfile.name = "profile1";
        newMocks.imperativeProfile.profile.user = "fake";
        newMocks.imperativeProfile.profile.password = "1234";
        newMocks.profileInstance = createInstanceOfProfile(globalMocks.profiles, newMocks.session);
        newMocks.mockLoadNamedProfile.mockReturnValue(newMocks.imperativeProfile);
        globalMocks.mockCreateInputBox.mockReturnValue(newMocks.inputBox);
        globalMocks.mockGetInstance.mockReturnValue(newMocks.profileInstance);
        newMocks.datasetSessionNode = createDatasetSessionNode(newMocks.session, newMocks.imperativeProfile);

        return newMocks;
    }

    it("Tests that editSession successfully edits a session of type zosmf", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        globalMocks.profiles.getProfileType = () => new Promise((resolve) => { resolve("zosmf"); });
        blockMocks.profileInstance.getSchema.mockResolvedValueOnce(blockMocks.testSchemas[0]);
        globalMocks.mockShowInputBox.mockResolvedValueOnce("https://fake:143");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("143");
        globalMocks.mockShowInputBox.mockResolvedValue("fake");
        globalMocks.mockShowQuickPick.mockResolvedValueOnce("False - Accept connections with self-signed certificates");
        globalMocks.mockCreateBasicZosmfSession.mockReturnValue(
            { ISession: { user: "fake", password: "fake", base64EncodedAuth: "fake" } });

        await globalMocks.profiles.editSession(blockMocks.imperativeProfile, blockMocks.imperativeProfile.name);
        expect(globalMocks.mockShowInformationMessage.mock.calls[0][0]).toBe("Profile was successfully updated");
    });

    it("Tests that editSession successfully edits a session of type alternate", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        globalMocks.profiles.getProfileType = () => new Promise((resolve) => { resolve("alternate"); });
        blockMocks.profileInstance.getSchema.mockResolvedValueOnce(blockMocks.testSchemas[1]);
        globalMocks.mockShowInputBox.mockResolvedValueOnce("https://fake:143");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("143");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake");
        globalMocks.mockShowQuickPick.mockResolvedValueOnce("False");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("123");
        globalMocks.mockCreateBasicZosmfSession.mockReturnValue(
            { ISession: { user: "fake", password: "fake", base64EncodedAuth: "fake" } });

        await globalMocks.profiles.editSession(blockMocks.imperativeProfile, blockMocks.imperativeProfile.name);
        expect(globalMocks.mockShowInformationMessage.mock.calls[0][0]).toBe("Profile was successfully updated");
    });

    it("Tests that editSession successfully edits a session of type alternate with entered port number", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        globalMocks.profiles.getProfileType = () => new Promise((resolve) => { resolve("alternate"); });
        blockMocks.profileInstance.getSchema.mockResolvedValueOnce(blockMocks.testSchemas[1]);
        globalMocks.mockShowInputBox.mockResolvedValueOnce("https://fake");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("143");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake");
        globalMocks.mockShowQuickPick.mockResolvedValueOnce("False");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("123");
        globalMocks.mockCreateBasicZosmfSession.mockReturnValue(
            { ISession: { user: "fake", password: "fake", base64EncodedAuth: "fake" } });

        await globalMocks.profiles.editSession(blockMocks.imperativeProfile, blockMocks.imperativeProfile.name);
        expect(globalMocks.mockShowInformationMessage.mock.calls[0][0]).toBe("Profile was successfully updated");
    });

    it("Tests that editSession successfully edits a session of type alternate with default aNumber", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        globalMocks.profiles.getProfileType = () => new Promise((resolve) => { resolve("alternate"); });
        blockMocks.profileInstance.getSchema.mockResolvedValueOnce(blockMocks.testSchemas[1]);
        globalMocks.mockShowInputBox.mockResolvedValueOnce("https://fake:143");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("143");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake");
        globalMocks.mockShowQuickPick.mockResolvedValueOnce("False");
        globalMocks.mockShowInputBox.mockResolvedValueOnce(undefined);
        globalMocks.mockCreateBasicZosmfSession.mockReturnValue(
            { ISession: { user: "fake", password: "fake", base64EncodedAuth: "fake" } });

        await globalMocks.profiles.editSession(blockMocks.imperativeProfile, blockMocks.imperativeProfile.name);
        expect(globalMocks.mockShowInformationMessage.mock.calls[0][0]).toBe("Profile was successfully updated");
    });

    it("Tests that editSession successfully edits a session of type alternate with empty aNumber", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        globalMocks.profiles.getProfileType = () => new Promise((resolve) => { resolve("alternate"); });
        blockMocks.profileInstance.getSchema.mockResolvedValueOnce(blockMocks.testSchemas[2]);
        globalMocks.mockShowInputBox.mockResolvedValueOnce("https://fake:143");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("143");
        globalMocks.mockShowInputBox.mockResolvedValueOnce(undefined);
        globalMocks.mockCreateBasicZosmfSession.mockReturnValue(
            { ISession: { user: "fake", password: "fake", base64EncodedAuth: "fake" } });

        await globalMocks.profiles.editSession(blockMocks.imperativeProfile, blockMocks.imperativeProfile.name);
        expect(globalMocks.mockShowInformationMessage.mock.calls[0][0]).toBe("Profile was successfully updated");
    });

    it("Tests that editSession successfully edits a session of type alternate with empty aOther value", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        globalMocks.profiles.getProfileType = () => new Promise((resolve) => { resolve("alternate"); });
        blockMocks.profileInstance.getSchema.mockResolvedValueOnce(blockMocks.testSchemas[2]);
        globalMocks.mockShowInputBox.mockResolvedValueOnce("https://fake:143");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("123");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("");
        globalMocks.mockCreateBasicZosmfSession.mockReturnValue(
            { ISession: { user: "fake", password: "fake", base64EncodedAuth: "fake" } });

        await globalMocks.profiles.editSession(blockMocks.imperativeProfile, blockMocks.imperativeProfile.name);
        expect(globalMocks.mockShowInformationMessage.mock.calls[0][0]).toBe("Profile was successfully updated");
    });

    it("Tests that editSession fails with invalid url supplied", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        globalMocks.profiles.getProfileType = () => new Promise((resolve) => { resolve("zosmf"); });
        blockMocks.profileInstance.getSchema.mockResolvedValueOnce(blockMocks.testSchemas[0]);
        globalMocks.mockShowQuickPick.mockResolvedValueOnce(undefined);

        await globalMocks.profiles.editSession(blockMocks.imperativeProfile, blockMocks.imperativeProfile.name);
        expect(globalMocks.mockShowErrorMessage.mock.calls[0][0]).toBe("Error: No valid value for z/OS URL. Operation Cancelled");
    });

    it("Tests that editSession fails with invalid rejectUnauthorized value supplied", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        globalMocks.profiles.getProfileType = () => new Promise((resolve) => { resolve("zosmf"); });
        blockMocks.profileInstance.getSchema.mockResolvedValueOnce(blockMocks.testSchemas[0]);
        globalMocks.mockShowInputBox.mockResolvedValueOnce("https://fake:143");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("143");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake");
        globalMocks.mockShowQuickPick.mockResolvedValueOnce(undefined);

        await globalMocks.profiles.editSession(blockMocks.imperativeProfile, blockMocks.imperativeProfile.name);
        expect(globalMocks.mockShowErrorMessage.mock.calls[0][0]).toBe("Error: No certificate option selected. Operation Cancelled");
    });

    it("Tests that editSession fails with invalid aBoolean value supplied on alternate profile type", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        globalMocks.profiles.getProfileType = () => new Promise((resolve) => { resolve("alternate"); });
        blockMocks.profileInstance.getSchema.mockResolvedValueOnce(blockMocks.testSchemas[1]);
        globalMocks.mockShowInputBox.mockResolvedValueOnce("https://fake:143");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("143");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("fake");
        globalMocks.mockShowQuickPick.mockResolvedValueOnce(undefined);

        await globalMocks.profiles.editSession(blockMocks.imperativeProfile, blockMocks.imperativeProfile.name);
        expect(globalMocks.mockShowErrorMessage.mock.calls[0][0]).toBe("Error: No boolean selected. Operation Cancelled");
    });

    it("Tests that editSession fails with invalid port value supplied", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        globalMocks.profiles.getProfileType = () => new Promise((resolve) => { resolve("alternate"); });
        blockMocks.profileInstance.getSchema.mockResolvedValueOnce(blockMocks.testSchemas[1]);
        globalMocks.mockShowInputBox.mockResolvedValueOnce("https://fake");
        globalMocks.mockShowInputBox.mockResolvedValueOnce("bad");

        await globalMocks.profiles.editSession(blockMocks.imperativeProfile, blockMocks.imperativeProfile.name);
        expect(globalMocks.mockShowErrorMessage.mock.calls[0][0]).toBe("Error: Invalid Port number provided or operation was cancelled");
    });
});

describe("Profiles Unit Tests - Function deleteProfile", () => {
    async function createBlockMocks(globalMocks) {
        const newMocks = {
            log: Logger.getAppLogger(),
            profiles: null,
            testDatasetTree: null,
            testUSSTree: null,
            testJobTree: null,
            mockLoadNamedProfile: jest.fn(),
            treeView: createTreeView(),
            datasetSessionNode: null,
            USSSessionNode: null,
            iJob: createIJobObject(),
            imperativeProfile: createIProfile(),
            session: null,
            testSchemas: createTestSchemas(),
            profileInstance: null
        };
        Object.defineProperty(globalMocks.commonApi, "getValidSession", { value: globalMocks.mockGetValidSession, configurable: true });
        globalMocks.mockCreateBasicZosmfSession.mockReturnValue(
            { ISession: { user: "fake", password: "fake", base64EncodedAuth: "fake" } });
        newMocks.profiles = await Profiles.createInstance(newMocks.log);
        newMocks.session = createBasicZosmfSession(newMocks.imperativeProfile);
        newMocks.profileInstance = createInstanceOfProfile(newMocks.profiles, newMocks.session);
        newMocks.mockLoadNamedProfile.mockReturnValue(newMocks.imperativeProfile);
        globalMocks.mockGetInstance.mockReturnValue(newMocks.profileInstance);
        newMocks.datasetSessionNode = createDatasetSessionNode(newMocks.session, newMocks.imperativeProfile);
        newMocks.USSSessionNode = createUSSSessionNode(newMocks.session, newMocks.imperativeProfile);
        newMocks.testDatasetTree = createDatasetTree(newMocks.datasetSessionNode, newMocks.treeView);
        newMocks.testUSSTree = createUSSTree([], [newMocks.USSSessionNode], newMocks.treeView);
        newMocks.testJobTree = createJobsTree(newMocks.session, newMocks.iJob, newMocks.profileInstance, newMocks.treeView);
        newMocks.testDatasetTree.addFileHistory("[profile1]: TEST.NODE");
        newMocks.testUSSTree.addFileHistory("[profile1]: /u/myuser");
        globalMocks.mockGetConfiguration.mockReturnValue(createPersistentConfig());

        return newMocks;
    }

    it("Tests that deleteProfile successfully deletes a profile from the command palette", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        globalMocks.mockShowQuickPick.mockResolvedValueOnce("profile1");
        globalMocks.mockShowQuickPick.mockResolvedValueOnce("Delete");

        await blockMocks.profiles.deleteProfile(blockMocks.testDatasetTree, blockMocks.testUSSTree, blockMocks.testJobTree);
        expect(globalMocks.mockShowInformationMessage.mock.calls.length).toBe(1);
        expect(globalMocks.mockShowInformationMessage.mock.calls[0][0]).toBe("Profile profile1 was deleted.");
    });

    it("Tests that deleteProfile successfully handles missing profile name selection", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        globalMocks.mockShowQuickPick.mockResolvedValueOnce(undefined);

        await blockMocks.profiles.deleteProfile(blockMocks.testDatasetTree, blockMocks.testUSSTree, blockMocks.testJobTree);
        expect(globalMocks.mockShowInformationMessage.mock.calls.length).toBe(1);
        expect(globalMocks.mockShowInformationMessage.mock.calls[0][0]).toBe("Operation Cancelled");
    });

    it("Tests that deleteProfile successfully handles case where user selects No", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        globalMocks.mockShowQuickPick.mockResolvedValueOnce("profile1");
        globalMocks.mockShowQuickPick.mockResolvedValueOnce("No");

        await blockMocks.profiles.deleteProfile(blockMocks.testDatasetTree, blockMocks.testUSSTree, blockMocks.testJobTree);
        expect(globalMocks.mockShowInformationMessage.mock.calls.length).toBe(1);
        expect(globalMocks.mockShowInformationMessage.mock.calls[0][0]).toBe("Operation Cancelled");
    });

    it("Tests that deleteProfile successfully executes when there are no profiles to delete", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        blockMocks.profiles.allProfiles = [];

        await blockMocks.profiles.deleteProfile(blockMocks.testDatasetTree, blockMocks.testUSSTree, blockMocks.testJobTree);
        expect(globalMocks.mockShowInformationMessage.mock.calls.length).toBe(1);
        expect(globalMocks.mockShowInformationMessage.mock.calls[0][0]).toBe("No profiles available");
    });

    it("Tests that deleteProfile successfully deletes profile from context menu", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        const dsNode = new ZoweDatasetNode(
            "testNode", vscode.TreeItemCollapsibleState.Expanded, null, blockMocks.session, undefined, undefined, blockMocks.imperativeProfile);
        dsNode.contextValue = globals.DS_SESSION_CONTEXT;
        globalMocks.mockShowQuickPick.mockResolvedValueOnce("Delete");

        await blockMocks.profiles.deleteProfile(blockMocks.testDatasetTree, blockMocks.testUSSTree, blockMocks.testJobTree, dsNode);
        expect(globalMocks.mockShowInformationMessage.mock.calls.length).toBe(1);
        expect(globalMocks.mockShowInformationMessage.mock.calls[0][0]).toBe("Profile sestest was deleted.");
    });

    it("Tests that deleteProfile successfully deletes a profile from a dataset tree", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        const startLength = blockMocks.testDatasetTree.mSessionNodes.length;
        const favoriteLength = blockMocks.testDatasetTree.mFavorites.length;
        const dsNode = new ZoweDatasetNode(
            "testNode", vscode.TreeItemCollapsibleState.Expanded, null, blockMocks.session, undefined, undefined, blockMocks.imperativeProfile);
        const dsNodeAsFavorite = new ZoweDatasetNode(`[${blockMocks.datasetSessionNode.label.trim()}]: testNode`,
            vscode.TreeItemCollapsibleState.None, blockMocks.testDatasetTree.mFavoriteSession, blockMocks.session,
            dsNode.contextValue, null, dsNode.getProfile());
        dsNode.contextValue = globals.DS_SESSION_CONTEXT;
        blockMocks.testDatasetTree.mSessionNodes.push(dsNode);
        blockMocks.testDatasetTree.addFavorite(dsNodeAsFavorite);
        globalMocks.mockShowQuickPick.mockResolvedValueOnce("Delete");

        await blockMocks.profiles.deleteProfile(blockMocks.testDatasetTree, blockMocks.testUSSTree, blockMocks.testJobTree, dsNode);
        expect(globalMocks.mockShowInformationMessage.mock.calls.length).toBe(1);
        expect(globalMocks.mockShowInformationMessage.mock.calls[0][0]).toBe("Profile sestest was deleted.");
        expect(blockMocks.testDatasetTree.mSessionNodes.length).toEqual(startLength);
        expect(blockMocks.testDatasetTree.mFavorites.length).toEqual(favoriteLength);
    });

    it("Tests that deleteProfile successfully deletes a profile from a USS tree", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        const startLength = blockMocks.testUSSTree.mSessionNodes.length;
        const favoriteLength = blockMocks.testUSSTree.mFavorites.length;
        const ussNode = new ZoweUSSNode(
            "[sestest]: testNode", vscode.TreeItemCollapsibleState.Expanded,
            null, blockMocks.session, null, false, blockMocks.imperativeProfile.name, null, blockMocks.imperativeProfile);
        const ussNodeAsFavorite = new ZoweUSSNode("[" + blockMocks.USSSessionNode.label.trim() + "]: testNode", vscode.TreeItemCollapsibleState.None,
            null, blockMocks.session, null, false, blockMocks.imperativeProfile.name, null, blockMocks.imperativeProfile);
        ussNode.contextValue = globals.USS_SESSION_CONTEXT;
        ussNode.profile = blockMocks.imperativeProfile;
        blockMocks.testUSSTree.mSessionNodes.push(ussNode);
        blockMocks.testUSSTree.mFavorites.push(ussNodeAsFavorite);
        globalMocks.mockShowQuickPick.mockResolvedValueOnce("Delete");

        await blockMocks.profiles.deleteProfile(blockMocks.testDatasetTree, blockMocks.testUSSTree, blockMocks.testJobTree, ussNode);
        expect(globalMocks.mockShowInformationMessage.mock.calls.length).toBe(1);
        expect(globalMocks.mockShowInformationMessage.mock.calls[0][0]).toBe("Profile sestest was deleted.");
        expect(blockMocks.testUSSTree.mSessionNodes.length).toEqual(startLength);
        expect(blockMocks.testUSSTree.mFavorites.length).toEqual(favoriteLength);
    });

    it("Tests that deleteProfile successfully deletes a profile from a jobs tree", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        const startLength = blockMocks.testJobTree.mSessionNodes.length;
        const favoriteLength = blockMocks.testJobTree.mFavorites.length;
        const jobNode = new Job(
            "testNode", vscode.TreeItemCollapsibleState.Expanded, null, blockMocks.session, blockMocks.iJob, blockMocks.imperativeProfile);
        const jobNodeAsFavorite = new Job(`[${blockMocks.datasetSessionNode.label.trim()}]: testNode`, vscode.TreeItemCollapsibleState.Expanded,
            null, blockMocks.session, blockMocks.iJob, blockMocks.imperativeProfile);
        jobNode.contextValue = globals.JOBS_SESSION_CONTEXT;
        blockMocks.testJobTree.mSessionNodes.push(jobNode);
        blockMocks.testJobTree.addFavorite(jobNodeAsFavorite);
        globalMocks.mockShowQuickPick.mockResolvedValueOnce("Delete");

        await blockMocks.profiles.deleteProfile(blockMocks.testDatasetTree, blockMocks.testUSSTree, blockMocks.testJobTree, jobNode);
        expect(globalMocks.mockShowInformationMessage.mock.calls.length).toBe(1);
        expect(globalMocks.mockShowInformationMessage.mock.calls[0][0]).toBe("Profile sestest was deleted.");
        expect(blockMocks.testJobTree.mSessionNodes.length).toEqual(startLength);
        expect(blockMocks.testJobTree.mFavorites.length).toEqual(favoriteLength);
    });

    it("Tests that deleteProfile successfully deletes all related file history items for a dataset tree", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        blockMocks.testDatasetTree.mFileHistory = ["[SESTEST]: TEST.DATA"];
        globalMocks.mockShowQuickPick.mockResolvedValueOnce("sestest");
        globalMocks.mockShowQuickPick.mockResolvedValueOnce("Delete");

        await blockMocks.profiles.deleteProfile(blockMocks.testDatasetTree, blockMocks.testUSSTree, blockMocks.testJobTree);
        expect(globalMocks.mockShowInformationMessage.mock.calls.length).toBe(1);
        expect(globalMocks.mockShowInformationMessage.mock.calls[0][0]).toBe("Profile sestest was deleted.");
        expect(blockMocks.testDatasetTree.getFileHistory()[0]).toBeUndefined();
    });

    it("Tests that deleteProfile successfully deletes all related file history items for a USS tree", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        blockMocks.testUSSTree.addFileHistory("[SESTEST]: /node1/node2/node3.txt");
        globalMocks.mockShowQuickPick.mockResolvedValueOnce("sestest");
        globalMocks.mockShowQuickPick.mockResolvedValueOnce("Delete");

        await blockMocks.profiles.deleteProfile(blockMocks.testDatasetTree, blockMocks.testUSSTree, blockMocks.testJobTree);
        expect(globalMocks.mockShowInformationMessage.mock.calls.length).toBe(1);
        expect(globalMocks.mockShowInformationMessage.mock.calls[0][0]).toBe("Profile sestest was deleted.");
        expect(blockMocks.testUSSTree.getFileHistory()[1]).toBeUndefined();
    });
});

describe("Profiles Unit Tests - Function createInstance", () => {
    async function createBlockMocks(globalMocks) {
        const newMocks = {
            log: Logger.getAppLogger(),
            profiles: null,
            session: createISessionWithoutCredentials(),
            mockJSONParse: jest.spyOn(JSON, "parse"),
            profileInstance: null,
            testProfiles: [{ name: "sestest", profile: {}, type: "zosmf" },
            { name: "profile1", profile: {}, type: "zosmf" },
            { name: "profile2", profile: {}, type: "zosmf" }]
        };
        Object.defineProperty(globalMocks.commonApi, "getValidSession", { value: globalMocks.mockGetValidSession, configurable: true });
        (child_process.spawnSync as any) = jest.fn((program: string, args: string[], options: any) => {
            const createFakeChildProcess = (status: number, stdout: string, stderr: string) => {
                return {
                    status: 0,
                    stdout,
                    stderr
                };
            };
            if (args[0].indexOf("getAllProfiles") >= 0) {
                return createFakeChildProcess(0, JSON.stringify(newMocks.testProfiles), "");
            } else {
                // load default profile
                return createFakeChildProcess(0, JSON.stringify(newMocks.testProfiles[0]), "");
            }
        });
        newMocks.profileInstance = createInstanceOfProfile(globalMocks.profiles, newMocks.session);
        globalMocks.mockGetInstance.mockReturnValue(newMocks.profileInstance);

        return newMocks;
    }

    it("Tests that createInstance executes successfully", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        const profiles = await Profiles.createInstance(blockMocks.log);
        expect(profiles).toStrictEqual(globalMocks.profiles);
    });

    it("Tests that createInstance successfully routes through to spawn", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        blockMocks.mockJSONParse.mockReturnValueOnce({
            overrides: { CredentialManager: "ANO" }

        });
        blockMocks.mockJSONParse.mockReturnValueOnce(blockMocks.testProfiles);
        blockMocks.mockJSONParse.mockReturnValueOnce(blockMocks.testProfiles[1]);

        await Profiles.createInstance(blockMocks.log);
        expect(Profiles.getInstance().allProfiles).toEqual(blockMocks.testProfiles);
    });

    it("Tests that createInstance properly handles errors when failing to route through to spawn", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        blockMocks.mockJSONParse.mockReturnValueOnce({
            overrides: undefined
        });
        blockMocks.mockJSONParse.mockReturnValueOnce(blockMocks.testProfiles);
        blockMocks.mockJSONParse.mockReturnValueOnce(blockMocks.testProfiles[1]);

        await Profiles.createInstance(blockMocks.log);
        expect(Profiles.getInstance().allProfiles).toEqual(blockMocks.testProfiles);
    });
});

describe("Profiles Unit Tests - Function getDefaultProfile", () => {
    async function createBlockMocks(globalMocks) {
        const newMocks = {
            log: Logger.getAppLogger(),
            profiles: null,
            validProfile: createValidIProfile(),
            session: createISessionWithoutCredentials(),
            profileInstance: null
        };
        Object.defineProperty(globalMocks.commonApi, "getValidSession", { value: globalMocks.mockGetValidSession, configurable: true });
        newMocks.profiles = await Profiles.createInstance(newMocks.log);
        newMocks.profileInstance = createInstanceOfProfile(newMocks.profiles, newMocks.session);
        globalMocks.mockGetInstance.mockReturnValue(newMocks.profiles);

        return newMocks;
    }

    it("Tests that getDefaultProfile returns the default profile", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        const loadedProfiles = globalMocks.defaultProfileManagerInstance.getDefaultProfile();
        expect(loadedProfiles).toEqual(blockMocks.validProfile);
    });
});

describe("Profiles Unit Tests - Function getProfiles", () => {
    async function createBlockMocks(globalMocks) {
        const newMocks = {
            log: Logger.getAppLogger(),
            profiles: null,
            session: createISessionWithoutCredentials(),
            profileInstance: null
        };
        Object.defineProperty(globalMocks.commonApi, "getValidSession", { value: globalMocks.mockGetValidSession, configurable: true });
        newMocks.profiles = await Profiles.createInstance(newMocks.log);
        newMocks.profileInstance = createInstanceOfProfile(newMocks.profiles, newMocks.session);
        globalMocks.mockGetInstance.mockReturnValue(newMocks.profiles);

        return newMocks;
    }

    it("Tests that getProfiles returns all profiles of the specified type", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        const profiles = await Profiles.createInstance(blockMocks.log);
        const loadedProfiles = profiles.getProfiles("zosmf");
        expect(loadedProfiles).toEqual([{ name: "sestest", profile: {}, type: "zosmf" },
        { name: "profile1", profile: {}, type: "zosmf" },
        { name: "profile2", profile: {}, type: "zosmf" }]);
    });
});

describe("Profiles Unit Tests - Function directLoad", () => {
    async function createBlockMocks(globalMocks) {
        const newMocks = {
            log: Logger.getAppLogger(),
            profiles: null,
            session: createISessionWithoutCredentials(),
            profileInstance: null
        };
        Object.defineProperty(globalMocks.commonApi, "getValidSession", { value: globalMocks.mockGetValidSession, configurable: true });
        newMocks.profiles = await Profiles.createInstance(newMocks.log);
        newMocks.profileInstance = createInstanceOfProfile(newMocks.profiles, newMocks.session);
        globalMocks.mockGetInstance.mockReturnValue(newMocks.profiles);

        return newMocks;
    }

    it("Tests that directLoad returns the specified profile", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        const theProfiles = await Profiles.createInstance(blockMocks.log);
        const profile = await theProfiles.directLoad("zosmf", "sestest");
        expect(profile.name).toEqual("sestest");
    });
});

describe("Profiles Unit Tests - Function getNamesForType", () => {
    async function createBlockMocks(globalMocks) {
        const newMocks = {
            log: Logger.getAppLogger(),
            profiles: null,
            session: createISessionWithoutCredentials(),
            profileInstance: null
        };
        Object.defineProperty(globalMocks.commonApi, "getValidSession", { value: globalMocks.mockGetValidSession, configurable: true });
        newMocks.profiles = await Profiles.createInstance(newMocks.log);
        newMocks.profileInstance = createInstanceOfProfile(newMocks.profiles, newMocks.session);
        globalMocks.mockGetInstance.mockReturnValue(newMocks.profiles);

        return newMocks;
    }

    it("Tests that getNamesForType returns all profile names for profiles of the specified type", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        const theProfiles = await Profiles.createInstance(blockMocks.log);
        expect((await theProfiles.getNamesForType("zosmf"))[1]).toEqual("profile1");
    });
});

describe("Profiles Unit Tests - Function getAllTypes", () => {
    async function createBlockMocks(globalMocks) {
        const newMocks = {
            log: Logger.getAppLogger(),
            profiles: null,
            session: createISessionWithoutCredentials(),
            profileInstance: null
        };
        Object.defineProperty(globalMocks.commonApi, "getValidSession", { value: globalMocks.mockGetValidSession, configurable: true });
        newMocks.profiles = await Profiles.createInstance(newMocks.log);
        newMocks.profileInstance = createInstanceOfProfile(newMocks.profiles, newMocks.session);
        globalMocks.mockGetInstance.mockReturnValue(newMocks.profiles);

        return newMocks;
    }

    it("Tests that getAllTypes returns the names of all profile types", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        const theProfiles = await Profiles.createInstance(blockMocks.log);

        const types = theProfiles.getAllTypes();
        expect(types).toEqual(["zosmf", "banana"]);
    });
});

describe("Profiles Unit Tests - Function loadNamedProfile", () => {
    async function createBlockMocks(globalMocks) {
        const newMocks = {
            log: Logger.getAppLogger(),
            profiles: null,
            session: createISessionWithoutCredentials(),
            profileInstance: null
        };
        Object.defineProperty(globalMocks.commonApi, "getValidSession", { value: globalMocks.mockGetValidSession, configurable: true });
        newMocks.profiles = await Profiles.createInstance(newMocks.log);
        newMocks.profileInstance = createInstanceOfProfile(newMocks.profiles, newMocks.session);
        globalMocks.mockGetInstance.mockReturnValue(newMocks.profiles);

        return newMocks;
    }

    it("Tests that loadNamedProfile returns the profile with the specified name", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        const profiles = await Profiles.createInstance(blockMocks.log);
        const loadedProfile = profiles.loadNamedProfile("profile2");
        expect(loadedProfile).toEqual({ name: "profile2", profile: {}, type: "zosmf" });
    });

    it("Tests that loadNamedProfile fails to load a non-existent profile", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        let success = false;
        const profiles = await Profiles.createInstance(blockMocks.log);
        try {
            profiles.loadNamedProfile("profile3");
        } catch (error) {
            expect(error.message).toEqual("Could not find profile named: profile3.");
            success = true;
        }
        expect(success).toBe(true);
    });
});

describe("Profiles Unit Tests - Function getValidProfile", () => {
    async function createBlockMocks(globalMocks) {
        const newMocks = {
            log: Logger.getAppLogger(),
            profiles: null,
            session: createISessionWithoutCredentials(),
            profileInstance: null,
            mockGetDefaultProfile: jest.fn(),
            mockCollectProfileDetails: jest.fn(),
            baseProfile: createValidBaseProfile(),
            serviceProfile: createValidIProfile()
        };
        newMocks.profileInstance = createInstanceOfProfile(newMocks.profiles, newMocks.session);
        newMocks.mockGetDefaultProfile.mockResolvedValue(newMocks.baseProfile);
        // globalMocks.defaultProfileManagerInstance.getDefaultProfile = newMocks.mockGetDefaultProfile;
        Object.defineProperty(globalMocks.commonApi, "collectProfileDetails", {value: newMocks.mockCollectProfileDetails, configurable: true});
        globalMocks.mockGetInstance.mockReturnValue(newMocks.profileInstance);

        return newMocks;
    }

    it("Tests that getValidProfile tries to retrieve the baseProfile immediately, if it is not passed in", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        const getDefaultSpy = jest.spyOn(globalMocks.defaultProfileManagerInstance, "getDefaultProfile");
        await ZoweExplorerApiRegister.getCommonApi(blockMocks.serviceProfile).getValidSession(blockMocks.serviceProfile, "sestest");

        expect(getDefaultSpy).toHaveBeenCalledTimes(1);
    });

    it("Tests that getValidProfile prompts for password if prompting = true", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        blockMocks.serviceProfile.profile.password = null;
        blockMocks.baseProfile.password = null;

        await ZoweExplorerApiRegister.getCommonApi(blockMocks.serviceProfile)
                                     .getValidSession(blockMocks.serviceProfile, "sestest", blockMocks.baseProfile, true);

        expect(blockMocks.mockCollectProfileDetails).toHaveBeenCalledTimes(1);
        expect(blockMocks.mockCollectProfileDetails).toHaveBeenCalledWith(["password"]);
    });

    it("Tests that getValidProfile prompts for host if prompting = true", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        blockMocks.serviceProfile.profile.host = null;
        blockMocks.baseProfile.host = null;

        await ZoweExplorerApiRegister.getCommonApi(blockMocks.serviceProfile)
                                     .getValidSession(blockMocks.serviceProfile, "sestest", blockMocks.baseProfile, true);

        expect(blockMocks.mockCollectProfileDetails).toHaveBeenCalledTimes(1);
        expect(blockMocks.mockCollectProfileDetails).toHaveBeenCalledWith(["host"]);
    });

    it("Tests that getValidProfile prompts for port if prompting = true", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        blockMocks.serviceProfile.profile.port = null;
        blockMocks.baseProfile.port = null;

        await ZoweExplorerApiRegister.getCommonApi(blockMocks.serviceProfile)
                                     .getValidSession(blockMocks.serviceProfile, "sestest", blockMocks.baseProfile, true);

        expect(blockMocks.mockCollectProfileDetails).toHaveBeenCalledTimes(1);
        expect(blockMocks.mockCollectProfileDetails).toHaveBeenCalledWith(["port"]);
    });

    it("Tests that getValidProfile prompts for basePath if prompting = true", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        blockMocks.serviceProfile.profile.basePath = null;
        blockMocks.baseProfile.basePath = null;
        blockMocks.serviceProfile.profile.host = null;
        blockMocks.baseProfile.host = null;

        await ZoweExplorerApiRegister.getCommonApi(blockMocks.serviceProfile)
                                     .getValidSession(blockMocks.serviceProfile, "sestest", blockMocks.baseProfile, true);

        expect(blockMocks.mockCollectProfileDetails).toHaveBeenCalledTimes(1);
        expect(blockMocks.mockCollectProfileDetails).toHaveBeenCalledWith(["host", "basePath"]);
    });

    it("Tests that getValidProfile successfully returns an array of new profile details", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        blockMocks.serviceProfile.profile.password = null;
        blockMocks.baseProfile.password = null;
        blockMocks.serviceProfile.profile.host = null;
        blockMocks.baseProfile.host = null;
        blockMocks.serviceProfile.profile.port = null;
        blockMocks.baseProfile.port = null;
        blockMocks.serviceProfile.profile.basePath = null;
        blockMocks.baseProfile.basePath = null;
        blockMocks.mockCollectProfileDetails.mockResolvedValue({
            host: "testHostNew",
            port: 1234,
            password: "testPassNew",
            basePath: "testBasePathNew"
        });

        await ZoweExplorerApiRegister.getCommonApi(blockMocks.serviceProfile)
                                     .getValidSession(blockMocks.serviceProfile, "sestest", blockMocks.baseProfile, true);

        expect(blockMocks.mockCollectProfileDetails).toHaveBeenCalledTimes(1);
        expect(blockMocks.mockCollectProfileDetails).toHaveBeenCalledWith(["password", "host", "port", "basePath"]);
    });

    it("Tests that getValidProfile throws an error if prompting fails", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        blockMocks.mockCollectProfileDetails.mockImplementation(() => { throw new Error("Test error!"); });
        await ZoweExplorerApiRegister.getCommonApi(blockMocks.serviceProfile)
                                     .getValidSession(blockMocks.serviceProfile, "sestest", blockMocks.baseProfile, true);

        expect(blockMocks.mockCollectProfileDetails).toThrowError("Test error!");
    });

    it("Tests that getValidProfile removes the 'password' key from the service profile if password is null", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        globalMocks.defaultProfile.profile.password = null;
        const defaultProfileNoPassword = globalMocks.defaultProfile;
        delete defaultProfileNoPassword.profile.password;

        await ZoweExplorerApiRegister.getCommonApi(globalMocks.defaultProfile)
                                     .getValidSession(globalMocks.defaultProfile, "sestest", blockMocks.baseProfile);

        expect(globalMocks.mockCreateBasicZosmfSession).toBeCalledWith(defaultProfileNoPassword.profile);
    });

    it("Tests that getValidProfile successfully returns a connected Session when not using the baseProfile (non-token auth)", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

    });

    it("Tests that getValidProfile throws an error if generating a Session fails when not using the baseProfile (non-token auth)", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

    });

    it("Tests that getValidProfile successfully returns a connected Session when prompting = true (token auth)", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

    });

    it("Tests that getValidProfile successfully returns a connected Session when prompting = false (token auth)", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

    });

    it("Tests that getValidProfile throws an error if generating a Session fails when using the baseProfile (token auth)", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

    });

    it("Tests that getValidProfile throws an error if baseProfile and serviceProfile.user are both missing", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

    });
});

describe("Profiles Unit Tests - Function checkCurrentProfile", () => {
    async function createBlockMocks(globalMocks) {
        const newMocks = {
            log: Logger.getAppLogger(),
            profiles: null,
            session: createISessionWithoutCredentials(),
            invalidProfile: createInvalidIProfile(),
            validProfile: createValidIProfile(),
            profileInstance: null
        };
        Object.defineProperty(globalMocks.commonApi, "getValidSession", { value: globalMocks.mockGetValidSession, configurable: true });
        newMocks.profiles = await Profiles.createInstance(newMocks.log);
        newMocks.profileInstance = createInstanceOfProfile(newMocks.profiles, newMocks.session);
        globalMocks.mockGetInstance.mockReturnValue(newMocks.profiles);

        return newMocks;
    }

    it("Tests that checkCurrentProfile is successful for a profile with valid stored credentials", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        await globalMocks.profiles.checkCurrentProfile(blockMocks.validProfile);
        expect(globalMocks.profiles.validProfile).toBe(ValidProfileEnum.VALID);
    });

    it("Tests that checkCurrentProfile is successful with invalid profile & valid session", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        await globalMocks.profiles.checkCurrentProfile(blockMocks.invalidProfile);
        expect(globalMocks.profiles.validProfile).toBe(ValidProfileEnum.VALID);
    });

    it("Tests that checkCurrentProfile fails with invalid profile & no valid session", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        globalMocks.mockGetValidSession.mockReturnValue(null);
        blockMocks.profiles.promptCredentials = jest.fn(() => {
            return undefined;
        });
        await globalMocks.profiles.checkCurrentProfile(blockMocks.invalidProfile);
        expect(globalMocks.profiles.validProfile).toBe(ValidProfileEnum.INVALID);
    });
});

describe("Profiles Unit Tests - Function refresh", () => {
    async function createBlockMocks(globalMocks) {
        const newMocks = {
            log: Logger.getAppLogger(),
            profiles: null,
            invalidProfile: createInvalidIProfile(),
            validProfile: createValidIProfile(),
            profileInstance: null,
        };
        Object.defineProperty(globalMocks.commonApi, "getValidSession", { value: globalMocks.mockGetValidSession, configurable: true });
        newMocks.profiles = await Profiles.createInstance(newMocks.log);
        newMocks.profileInstance = createInstanceOfProfile(newMocks.profiles, createBasicZosmfSession(newMocks.validProfile));
        globalMocks.mockGetInstance.mockReturnValue(newMocks.profiles);

        return newMocks;
    }

    it("Tests that Profile refresh empties profilesForValidation[]", async () => {
        const globalMocks = await createGlobalMocks();
        const blockMocks = await createBlockMocks(globalMocks);

        const theProfiles = await Profiles.createInstance(blockMocks.log);
        theProfiles.profilesForValidation.push({ status: "active", name: blockMocks.validProfile.name });
        await theProfiles.refresh();
        expect(theProfiles.profilesForValidation.length).toBe(0);
    });
});

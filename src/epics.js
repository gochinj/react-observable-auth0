import Auth0 from "auth0-js";

import { ofType } from "redux-observable";

import { EMPTY } from "rxjs";

import { switchMap, map, delay } from "rxjs/operators";

import sessionApi from "./session-api";

import {
	auth0Error,
	auth0Authenticated,
	auth0RenewToken,
	AUTH0_LOGOUT,
	AUTH0_AUTHORIZE,
	AUTH0_AUTHENTICATED,
	AUTH0_CALLBACK,
	AUTH0_RENEW_TOKEN,
	authNoop
} from "./actions";

import { BrowserRouter } from "react-router-dom";

const auth0AuthorizeEpic = (action$, state$) => {

	return action$.pipe(
		ofType(AUTH0_AUTHORIZE),
		map(({ redirectUri, auth0Config, loggedIn }) => {
			const redirectUrl = auth0Config.callbackUrl + (redirectUri ? "?returnPath=" + redirectUri : "");

			if (!loggedIn) {
				const auth0 = new Auth0.WebAuth({
					domain: auth0Config.domain,
					clientID: auth0Config.clientId,
					redirectUri: redirectUrl,
					audience: auth0Config.audience,
					responseType: auth0Config.responseType,
					scope: auth0Config.scope
				});

				auth0.authorize();
				return authNoop();
			} else {
				const session = sessionApi.getSession();
				return auth0RenewToken(session.expires);
			}


		}));
}

const auth0CallbackEpic = (action$, state$) => {

	function promiseToParseHash(auth0Config) {
		const auth0 = new Auth0.WebAuth({
			domain: auth0Config.domain,
			clientID: auth0Config.clientId,
			redirectUri: auth0Config.callbackUrl, //+ (redirectUri ? "?returnPath=" + auth0.redirectUri : ""),
			audience: auth0Config.audience,
			responseType: auth0Config.responseType,
			scope: auth0Config.scope
		});

		return new Promise((resolve, reject) => {
			auth0.parseHash((err, authResult) => {
				if (err) {
					reject(err);
				} else {
					resolve(authResult);
				}
			});
		})
	}

	return action$.pipe(
		ofType(AUTH0_CALLBACK),
		switchMap(({ auth0Config, returnPath }) => promiseToParseHash(auth0Config)
			.then(authResult => auth0Authenticated(authResult, returnPath))
			.catch(err => auth0Error(err))
		));
}

const auth0AuthenticatedEpic = (action$, state$) => {
	console.log("[auth0AuthenticatedEpic]");
	return action$.pipe(
		ofType(AUTH0_AUTHENTICATED),
		map(({ renewalTimeout }) => {
			return auth0RenewToken(renewalTimeout);
		})
	);
}

const auth0RenewTokenEpic = (action$, state$) => {
	const session = sessionApi.getSession(),
		timeout = session.expires - Date.now();

	function promiseToRenewToken(auth0Config) {
		const auth0 = new Auth0.WebAuth({
			domain: auth0Config.domain,
			clientID: auth0Config.clientId,
			redirectUri: auth0Config.callbackUrl,
			audience: auth0Config.audience,
			responseType: auth0Config.responseType,
			scope: auth0Config.scope
		})

		return new Promise((resolve, reject) => {
			auth0.checkSession({}, (err, result) => {
				if (err) {
					reject(err);
				} else {
					sessionApi.setSession(result);
					resolve();
				}
			});
		})
	}

	return action$.pipe(
		ofType(AUTH0_RENEW_TOKEN),
		delay(timeout > 0 ? timeout : 0),
		switchMap(() => {
			const state = state$.getState();

			return promiseToRenewToken(state.auth0.auth0Config)
				.then(() => authNoop())
				.catch(err => auth0Error(err))
		}));
}


const auth0LogoutEpic = (action$, state$) => {
	return action$.pipe(
		ofType(AUTH0_LOGOUT),
		map(() => {
			const state = state$.getState(),
				auth0Config = state.auth0.auth0Config,
				auth0 = new Auth0.WebAuth({
					domain: auth0Config.domain,
					clientID: auth0Config.clientId,
					redirectUri: auth0Config.callbackUrl,
					audience: auth0Config.audience,
					responseType: auth0Config.responseType,
					scope: auth0Config.scope
				});

			auth0.logout();

			return authNoop();
		}));
}



export { auth0AuthorizeEpic, auth0LogoutEpic, auth0CallbackEpic, auth0RenewTokenEpic, auth0AuthenticatedEpic };

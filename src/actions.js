import { sessionApi } from "./index";

export const AUTH0_INIT = "AUTH0_INIT";
export const AUTH0_AUTHORIZE = "AUTH0_AUTHORIZE";
export const AUTH0_CALLBACK = "AUTH0_CALLBACK";
export const AUTH0_AUTHENTICATED = "AUTH0_AUTHENTICATED";
export const AUTH0_ERROR = "AUTH0_ERROR";
export const AUTH0_LOGOUT = "AUTH0_LOGOUT";
export const AUTH0_RENEW_TOKEN = "AUTH0_RENEW_TOKEN";
export const AUTH0_NOOP = "AUTH0_NOOP";


export function auth0Init(auth0Config) {
	const session = sessionApi.getSession();

	return {
		type: AUTH0_INIT,
		loggedIn: !!session.accessToken,
		inProgress: false,
		auth0Config,
		session
	}
}

/**
 * Checks the provided `isAuthenticated`, when true will return an actions with
 * the `loggedIn` and `inProgress` to true and false respectively.
 *
 * Because the behavior is to redirect to an off-site link (auth0.com) we really
 * would never return the action. But, we'll do the redirect in a callback to
 * setTimeout, and return the action with `loggedIn` and `inProgress` to false
 * and true respectively.
 *
 * QUESTION: How to persist state?  localStorage or sessionStorage? Check for
 * 			 npm package that already handles this.
 *
 */
export function authorize(auth0Config, redirectUri) {
	const sessionData = sessionApi.getSession(),
		isAuthenticated = sessionApi.checkAuthenticationStatus(sessionData.accessToken, sessionData.expires),
		action = {
			type: AUTH0_AUTHORIZE,
			auth0Config,
			loggedIn: isAuthenticated,
			inProgress: !isAuthenticated,
			session: sessionData,
			redirectUri
		};

	return action;
}

export function auth0Logout() {
	sessionApi.deleteSession();

	return {
		type: AUTH0_LOGOUT,
		loggedIn: false,
		inProgress: false
	}
}

export function auth0Authenticated(authResult, returnPath) {
	sessionApi.setSession(authResult);

	return {
		type: AUTH0_AUTHENTICATED,
		loggedIn: true,
		inProgress: false,
		returnPath: returnPath,
		session: authResult
	}
}

export function auth0Callback(auth0Config, returnPath) {
	const action = {
		type: AUTH0_CALLBACK,
		auth0Config,
		returnPath,
		loggedIn: false,
		inProgress: false
	};

	return action;
}

export function auth0Error(err) {
	return {
		type: AUTH0_ERROR,
		error: err,
		loggedIn: false,
		inProgress: false,
		session: {}
	}
}

export function auth0RenewToken(auth0Config, delay) {
	return {
		type: AUTH0_RENEW_TOKEN,
		renewalTime: delay,
		auth0Config
	}
}

export function authNoop() {
	return {
		type: AUTH0_NOOP
	}
}

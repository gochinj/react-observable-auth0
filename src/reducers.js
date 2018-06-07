import { AUTH0_INIT, AUTH0_AUTHORIZE, AUTH0_AUTHENTICATED, AUTH0_CALLBACK, AUTH0_ERROR, AUTH0_RENEW_TOKEN } from "./actions";
import md5 from "md5";

const initialState = {
	loggedIn: false,
	inProgress: false,
	session: {},
	auth0Config: null
}

function initAuth0Reducer(state = initialState, action) {
	console.log(action, state);

	switch (action.type) {
	case AUTH0_INIT:
	case AUTH0_AUTHORIZE:
		const n = {
				auth0Config: action.auth0Config,
				loggedIn: action.loggedIn,
				inProgress: action.inProgress,
				session: action.session,
				redirectUri: action.redirectUri
			},
			a = md5(JSON.stringify(state)),
			b = md5(JSON.stringify(n));

		return a === b ? state : Object.assign({}, state, n);

	case AUTH0_CALLBACK:
		const newState = Object.assign({}, state, {
			err: action.err,
			session: action.authResult,
			loggedIn: action.loggedIn,
			inProgress: action.inProgress,
			returnPath: action.returnPath
		});

		return newState;
		// case AUTH0_LOGIN:
		// case AUTH0_LOGOUT:
	case AUTH0_AUTHENTICATED:
		return Object.assign({}, state, { loggedIn: action.loggedIn, inProgress: action.inProgress, returnPath: action.returnPath, renewalTimeout: action.renewalTimeout });

	case AUTH0_RENEW_TOKEN:

		return Object.assign({}, state, { renewalTimeout: action.renewalTimeout });

	case AUTH0_ERROR:
		return Object.assign({}, state, { loggedIn: false, inProgress: false, error: action.error.errorDescription });

	default:
		return state;
	}
}

export default initAuth0Reducer;

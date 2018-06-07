import { auth0RenewToken } from "./actions";

export default {
	isAuthenticated: () => {
		const auth0 = JSON.parse(localStorage.getItem("auth")),
			isAuthenticated = !!auth0 ? this.checkAuthenticationStatus(auth0.accessToken, auth0.expires) : false;

		return isAuthenticated;
	},
	checkAuthenticationStatus: (accessToken, expires) => {
		const now = new Date(),
			expired = now.getTime() >= expires,
			isAuthenticated = !!accessToken && !expired;

		return isAuthenticated;
	},
	getSession: () => {
		return JSON.parse(localStorage.getItem("auth") || "{}");
	},
	deleteSession: () => {
		localStorage.removeItem("auth");
	},
	setSession: (authResult) => {
		// Set the time that the access token will expire at
		const expiresIn = authResult.expiresIn * 1000,
			authSession = {
				"accessToken": authResult.accessToken,
				"idToken": authResult.idToken,
				"expires": Date.now() + expiresIn
			};

		localStorage.setItem("auth", JSON.stringify(authSession));

		// schedule a token renewal
		//this.scheduleRenewal();

	}


};

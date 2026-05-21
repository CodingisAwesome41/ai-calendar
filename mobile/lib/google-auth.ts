import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { linkGoogleCode } from "./api";

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
};

export function useGoogleAuthRequest() {
  const clientId =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ??
    "";

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "aicalendar",
  });

  return AuthSession.useAuthRequest(
    {
      clientId,
      scopes: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
      ],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      extraParams: { access_type: "offline", prompt: "consent" },
    },
    discovery
  );
}

export async function connectGoogleViaBrowser(authUrl: string): Promise<boolean> {
  const result = await WebBrowser.openAuthSessionAsync(
    authUrl,
    AuthSession.makeRedirectUri({ scheme: "aicalendar" })
  );
  return result.type === "success";
}

export async function exchangeAuthCode(code: string): Promise<void> {
  await linkGoogleCode(code);
}

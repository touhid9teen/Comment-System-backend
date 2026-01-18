import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import { config } from "./env.js";
import type { Profile } from "passport-google-oauth20";
import type { VerifyCallback } from "passport-oauth2";

export const configurePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
        passReqToCallback: false, // Don't pass request to callback
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: VerifyCallback,
      ) => {
        try {
          // Check if user exists
          let user = await User.findOne({ oauthId: profile.id });

          if (user) {
            return done(null, user);
          }

          // Check if user exists with same email (link account)
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = await User.findOne({ email });
            if (user) {
              user.oauthId = profile.id;
              user.oauthProvider = "google";
              if (!user.avatar && profile.photos?.[0]?.value) {
                user.avatar = profile.photos[0].value;
              }
              await user.save();
              return done(null, user);
            }
          }

          // Create new user
          user = await User.create({
            oauthId: profile.id,
            oauthProvider: "google",
            name: profile.displayName || "User",
            email: email!, // email is required
            avatar: profile.photos?.[0]?.value || null,
            isEmailVerified: true,
            password: null,
          });

          done(null, user);
        } catch (error) {
          done(error as any, undefined);
        }
      },
    ),
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, undefined);
    }
  });
};

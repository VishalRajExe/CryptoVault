package com.vishal.config;

/**
 * Temporary, simple way to designate a platform admin without building a full
 * admin-invitation/promotion flow: any account whose email matches this constant
 * is granted ROLE_ADMIN. Checked in two places:
 *   1. AuthController.createUserHandler - new signups with this email get
 *      ROLE_ADMIN immediately.
 *   2. CustomeUserServiceImplementation.loadUserByUsername - as a safety net so an
 *      account that already existed (signed up before this email was designated
 *      admin, or whose role was changed back) is promoted on next login too,
 *      without needing a manual database edit.
 *
 * Replace with a real role-management system (DB-driven allowlist, an admin
 * invite flow, etc) before this goes anywhere near production with real users.
 */
public final class AdminConfig {
    public static final String ADMIN_EMAIL = "vishalraj12.badal@gmail.com";

    private AdminConfig() {}
}

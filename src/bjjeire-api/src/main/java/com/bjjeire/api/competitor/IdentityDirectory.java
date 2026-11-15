package com.bjjeire.api.competitor;

/**
 * The external tenant that holds competitor sign-in identities (research R11). Deleting an account removes the person
 * from it, so they can no longer sign in.
 */
public interface IdentityDirectory {
    /**
     * Deletes a user. A user who is already gone counts as deleted.
     *
     * @param objectId the user's directory object id ({@code oid} claim)
     * @throws IdentityDirectoryException when the directory refuses or cannot be reached
     */
    void deleteUser(String objectId);

    /** The directory did not delete the user. The message never holds a credential. */
    class IdentityDirectoryException extends RuntimeException {
        private static final long serialVersionUID = 1L;

        public IdentityDirectoryException(String message) {
            super(message);
        }

        public IdentityDirectoryException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}

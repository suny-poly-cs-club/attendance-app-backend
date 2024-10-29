/**
 * Simple middleware to check if a user is authenticated or not
 */
export const authenticated =
  ({requireAdmin = false} = {}) =>
  async (req, reply) => {
    const authdUser = await req.ctx.getAuthenticatedUser();

    // the user does not exist
    if (!authdUser) {
      reply.status(401).send();
      return;
    }

    // the user is not an admin
    if (requireAdmin && !authdUser.isAdmin) {
      reply.status(403).send();
      return;
    }

    req.user = authdUser;
  };

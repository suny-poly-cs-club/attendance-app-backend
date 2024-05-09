/**
 * Transforms Valibot issues to the format used by
 * antd for form validation
 *
 * @param {import('valibot').Issues} issues
 */
export const mapValibotToFormError = issues => ({
  type: 'validation_error',
  issues: issues.map(issue => ({
    name: issue.path?.map(p => p.key),
    errors: [issue.message],
  }))
});

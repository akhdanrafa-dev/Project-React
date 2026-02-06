# TODO: Fix Staff Chat Issue

## Issue: Staff cannot send messages to developers
- Root cause: Missing `/api/developers` endpoint
- Frontend tries to fetch developers but endpoint doesn't exist

## Completed Tasks
- [x] Added `/api/developers` endpoint to `routes/api.php`
- [x] Endpoint returns list of developers with required fields

## Pending Tasks
- [ ] Test the staff chat functionality
- [ ] Verify staff can access developer management page
- [ ] Verify staff can send messages to developers
- [ ] Check for any other missing dependencies

## Files Modified
- `routes/api.php`: Added `/api/developers` endpoint

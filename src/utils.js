export const partialApplyDispatch = (dispatch, ...presetArgs) => 
	(...laterArgs) => {
		dispatch.call.call(dispatch, ...presetArgs, ...laterArgs);
	}
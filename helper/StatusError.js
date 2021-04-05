class StatusError extends Error {
	static badRequest(message) {
		return new StatusError(400, message || 'Bad request')
	}
	static unauthorized(message) {
		return new StatusError(401, message || 'Unauthorized')
	}
	static forbidden(message) {
		return new StatusError(403, message || 'Forbidden')
	}
	static notFound(message) {
		return new StatusError(404, message || 'Not found')
	}
	static conflict(message) {
		return new StatusError(409, message || 'Conflict')
	}
	static unprocessable(message) {
		return new StatusError(422, message || 'Unprocessable entity')
	}
	static internalError(message) {
		return new StatusError(500, message || 'Internal error')
	}
	static badGateway(message) {
		return new StatusError(502, message || 'Bad gateway')
	}

	constructor(code, message, name) {
		super(message)

		this.statusCode = code
		this.name = name
	}
}

module.exports = StatusError

package com.urbanpulse.shared.error;

public class InvalidIncidentTransitionException extends RuntimeException {

    public InvalidIncidentTransitionException(String message) {
        super(message);
    }
}

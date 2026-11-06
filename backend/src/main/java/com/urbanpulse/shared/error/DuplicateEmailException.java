package com.urbanpulse.shared.error;

public class DuplicateEmailException extends RuntimeException {

    public DuplicateEmailException() {
        super("Ya existe una cuenta con este email");
    }
}


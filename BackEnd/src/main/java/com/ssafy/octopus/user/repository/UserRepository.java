package com.ssafy.octopus.user.repository;

import com.ssafy.octopus.user.entity.User;
import com.ssafy.octopus.user.entity.UserDto;
import org.springframework.data.jpa.repository.JpaRepository;

/*
 * Write by SJH
 * */
public interface UserRepository extends JpaRepository<User, Integer> {
    User findByIdx(int idx); // find user by idx(pk)
    User findByUserName(String id); // find user by id(user_id)
    User findByUserNameAndUserPw(String userName, String userPw); // find user by id, pw (for login)
    User save(User user); // insert user (for sign up)
    boolean deleteByIdx(int idx); // delete user (for secession)

    boolean existsByUserName(String userName);
}

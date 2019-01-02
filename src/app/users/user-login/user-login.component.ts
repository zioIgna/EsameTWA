import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { UsersService } from '../users.service';

@Component({
  selector: 'app-user-login',
  templateUrl: './user-login.component.html',
  styleUrls: ['./user-login.component.css']
})
export class UserLoginComponent implements OnInit {

  email = '';
  password = '';

  constructor(private usersService: UsersService) { }

  onLogin(form: NgForm) {
    if (form.invalid) {
      return;
    }
    this.usersService.login(form.value.email, form.value.password);
    form.resetForm();
  }


  ngOnInit() {
  }

}
